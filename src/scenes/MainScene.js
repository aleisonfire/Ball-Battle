import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.ball = null;
        this.player = null;
        this.BALL_SPEED = 300;
        this.PLAYER_SPEED = 400;
        this.JUMP_VELOCITY = -600;
        this.cursors = null;
        this.canJump = true;
        this.swingHitbox = null;
        this.isSwinging = false;
        this.swingDuration = 300;
        this.swingCooldown = false;
        this.MAX_BALL_SPEED = Number.MAX_SAFE_INTEGER;
        this.speedMeter = null;
        this.speedMeterFill = null;
        // Hit stop effect properties
        this.HIT_STOP_THRESHOLD = 4500;
        this.BASE_HIT_STOP_DURATION = 100;
        this.hitStopCount = 0;
        this.isHitStopped = false;

        // Debug menu properties
        this.debugMenuLeft = null;
        this.debugMenuRight = null;
        this.debugTexts = {};
        this.sliders = {};
    }

    preload() {
        // No need to create circle in preload
    }

    createDebugMenu() {
        // Left side - Control Panel
        const leftPanelWidth = 200;
        const leftPanel = this.add.rectangle(0, 0, leftPanelWidth, this.game.config.height, 0x000000, 0.7);
        leftPanel.setOrigin(0, 0);

        const style = { fontSize: '32px', fill: '#fff' };
        let yPos = 20;

        // Ball Speed Slider
        this.add.text(10, yPos, 'Ball Speed:', style);
        this.sliders.ballSpeed = this.add.rectangle(100, yPos + 15, 100, 10, 0x666666);
        this.sliders.ballSpeed.setInteractive();
        this.sliders.ballSpeed.on('pointerdown', (pointer) => {
            const newSpeed = (pointer.x - this.sliders.ballSpeed.x) * 10;
            this.BALL_SPEED = Phaser.Math.Clamp(newSpeed, 100, 1000);
        });
        yPos += 40;

        // Player Speed Slider
        this.add.text(10, yPos, 'Player Speed:', style);
        this.sliders.playerSpeed = this.add.rectangle(100, yPos + 15, 100, 10, 0x666666);
        this.sliders.playerSpeed.setInteractive();
        this.sliders.playerSpeed.on('pointerdown', (pointer) => {
            const newSpeed = (pointer.x - this.sliders.playerSpeed.x) * 10;
            this.PLAYER_SPEED = Phaser.Math.Clamp(newSpeed, 200, 800);
        });
        yPos += 40;

        // Player Size Controls
        this.add.text(10, yPos, 'Player Size:', style);
        const widthBtn = this.add.text(100, yPos, '+W', style).setInteractive();
        const heightBtn = this.add.text(140, yPos, '+H', style).setInteractive();
        widthBtn.on('pointerdown', () => {
            this.player.width = Phaser.Math.Clamp(this.player.width + 5, 20, 100);
        });
        heightBtn.on('pointerdown', () => {
            this.player.height = Phaser.Math.Clamp(this.player.height + 5, 50, 200);
        });

        // Right side - Statistics Panel
        const rightPanelWidth = 200;
        const rightPanel = this.add.rectangle(this.game.config.width - rightPanelWidth, 0, rightPanelWidth, this.game.config.height, 0x000000, 0.7);
        rightPanel.setOrigin(0, 0);

        yPos = 20;
        this.debugTexts.ballSpeed = this.add.text(this.game.config.width - 190, yPos, 'Ball Speed: 0', style);
        yPos += 30;
        this.debugTexts.ballPos = this.add.text(this.game.config.width - 190, yPos, 'Ball Pos: 0,0', style);
        yPos += 30;
        this.debugTexts.playerPos = this.add.text(this.game.config.width - 190, yPos, 'Player Pos: 0,0', style);
        yPos += 30;
        this.debugTexts.playerVel = this.add.text(this.game.config.width - 190, yPos, 'Player Vel: 0,0', style);
    }

    create() {
        // Create coordinate ruler system
        this.createCoordinateRuler();

        // Create the ball sprite with physics
        this.ball = this.add.circle(400, 300, 10, 0xffffff);
        this.physics.add.existing(this.ball);

        // Set ball properties
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setBounce(1, 1);
        this.ball.body.setVelocity(this.BALL_SPEED, this.BALL_SPEED);

        // Remove maximum velocity limit to allow continuous speed increase
        this.ball.body.setMaxVelocity(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

        // Create the player
        this.player = this.add.rectangle(400, 500, 25, 100, 0x00ff00);
        this.physics.add.existing(this.player, false);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(2000); // Increased gravity
        this.player.body.setFriction(0);
        this.player.body.setDragX(0);
        
        // Create ground collision detection
        const ground = this.add.rectangle(960, 900, 1920, 20, 0x666666);
        this.physics.add.existing(ground, true);
        this.physics.add.collider(this.player, ground);

        // Debug visualization
        this.physics.world.createDebugGraphic();

        // Create swing hitbox (initially invisible)
        this.swingHitbox = this.add.rectangle(0, 0, 150, 40, 0xff0000);
        this.physics.add.existing(this.swingHitbox, false);
        this.swingHitbox.visible = false;
        this.swingHitbox.active = false;

        // Create speed meter UI
        const meterWidth = 200;
        const meterHeight = 20;
        const meterX = this.game.config.width / 2 - meterWidth / 2;
        const meterY = 30;

        // Create meter background
        this.speedMeter = this.add.rectangle(meterX, meterY, meterWidth, meterHeight, 0x333333);
        this.speedMeter.setOrigin(0, 0);

        // Create meter fill
        this.speedMeterFill = this.add.rectangle(meterX, meterY, 0, meterHeight, 0x00ff00);
        this.speedMeterFill.setOrigin(0, 0);

        // Add speed text
        this.speedText = this.add.text(meterX + meterWidth / 2, meterY + meterHeight + 5, '0 px/s', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5, 0);

        // Create debug menu
        this.createDebugMenu();

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Set up touch controls
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                const newX = Phaser.Math.Clamp(pointer.x, this.player.width/2, this.game.config.width - this.player.width/2);
                this.player.x = newX;
            }
        });

        // Add touch jump control
        this.input.on('pointerdown', (pointer) => {
            if (this.canJump && this.player.body.touching.down) {
                this.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.canJump = false;
            }
        });

        this.input.on('pointerup', () => {
            this.canJump = true;
        });

        // Add collision detection between ball and swing hitbox
        this.physics.add.overlap(this.ball, this.swingHitbox, this.handleBallHit, null, this);

        // Track ball ownership
        this.ballOwner = null;
    }

    startSwing() {
        if (!this.isSwinging) {
            this.isSwinging = true;
            this.swingCooldown = true;
            this.swingHitbox.visible = true;
            this.swingHitbox.active = true;

            // Position the hitbox in front of the player
            this.updateSwingHitboxPosition();

            // End swing after duration
            this.time.delayedCall(this.swingDuration, () => {
                this.endSwing();
            });

            // Reset cooldown
            this.time.delayedCall(this.swingDuration * 1.5, () => {
                this.swingCooldown = false;
            });
        }
    }

    endSwing() {
        this.isSwinging = false;
        this.swingHitbox.visible = false;
        this.swingHitbox.active = false;
    }

    updateSwingHitboxPosition() {
        // Position the hitbox in front of the player
        this.swingHitbox.x = this.player.x;
        this.swingHitbox.y = this.player.y;
    }

    handleBallHit(ball, hitbox) {
        if (this.isSwinging) {
            // Calculate impact point and new direction
            const impactPoint = (ball.y - hitbox.y) / hitbox.height;
            const angle = -75 + (impactPoint * 150);
            const angleRad = Phaser.Math.DegToRad(angle);
    
            // Get current speed
            const currentSpeed = Math.sqrt(Math.pow(ball.body.velocity.x, 2) + Math.pow(ball.body.velocity.y, 2));
            
            // Calculate speed increase with a more aggressive boost
            const baseIncrease = Math.max(currentSpeed * 0.3, 100);
            const newSpeed = currentSpeed + baseIncrease;
    
            // Set new velocity components while maintaining the calculated angle
            const velocityX = Math.cos(angleRad) * newSpeed;
            const velocityY = Math.sin(angleRad) * newSpeed;
            
            // Apply velocity
            ball.body.setVelocity(velocityX, velocityY);
    
            // Update ball ownership
            this.ballOwner = this.player;

            // Check if speed exceeds threshold for hit stop effect
            if (newSpeed > this.HIT_STOP_THRESHOLD && !this.isHitStopped) {
                this.isHitStopped = true;
                this.hitStopCount++;
                
                // Calculate hit stop duration with slight increase for each hit
                const hitStopDuration = this.BASE_HIT_STOP_DURATION + (this.hitStopCount * 100);
                
                // Store current velocities
                const storedVelocityX = ball.body.velocity.x;
                const storedVelocityY = ball.body.velocity.y;
                const storedPlayerVelocityX = this.player.body.velocity.x;
                const storedPlayerVelocityY = this.player.body.velocity.y;
                
                // Completely freeze both objects by disabling their physics bodies
                ball.body.enable = false;
                this.player.body.enable = false;
                
                // Resume normal physics after the hit stop duration
                this.time.addEvent({
                    delay: hitStopDuration,
                    callback: () => {
                        // Re-enable physics bodies
                        ball.body.enable = true;
                        this.player.body.enable = true;
                        
                        // Restore velocities
                        ball.body.setVelocity(storedVelocityX, storedVelocityY);
                        this.player.body.setVelocity(storedPlayerVelocityX, storedPlayerVelocityY);
                        this.isHitStopped = false;
                    },
                    callbackScope: this
                });
            }
        }
    }

    updateSpeedMeter() {
        // Calculate current ball speed
        const currentSpeed = Math.sqrt(Math.pow(this.ball.body.velocity.x, 2) + Math.pow(this.ball.body.velocity.y, 2));
        
        // Update meter fill width based on speed
        const fillWidth = (currentSpeed / this.MAX_BALL_SPEED) * this.speedMeter.width;
        this.speedMeterFill.width = fillWidth;

        // Update fill color based on speed
        let fillColor;
        if (currentSpeed < this.BALL_SPEED) {
            fillColor = 0x00ff00; // Green for low speed
        } else if (currentSpeed < this.MAX_BALL_SPEED * 0.6) {
            fillColor = 0xffff00; // Yellow for medium speed
        } else {
            fillColor = 0xff0000; // Red for high speed
        }
        this.speedMeterFill.setFillStyle(fillColor);

        // Update speed text
        this.speedText.setText(`${Math.round(currentSpeed)} px/s`);
    }

    update() {
        if (!this.isHitStopped) {
            // Keyboard controls for movement
            if (this.cursors.left.isDown) {
                this.player.body.setVelocityX(-this.PLAYER_SPEED);
            } else if (this.cursors.right.isDown) {
                this.player.body.setVelocityX(this.PLAYER_SPEED);
            } else {
                this.player.body.setVelocityX(0);
            }

            // Keyboard controls for jumping
            if (this.cursors.up.isDown && this.canJump && this.player.body.touching.down) {
                this.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.canJump = false;
            }

            if (this.cursors.up.isUp) {
                this.canJump = true;
            }

            // Keyboard controls for swinging
            if (this.cursors.down.isDown && !this.swingCooldown) {
                this.startSwing();
            }

            // Update swing hitbox position if swinging
            if (this.isSwinging) {
                this.updateSwingHitboxPosition();
            }

            // Handle ball-player collision based on ownership
            if (this.physics.overlap(this.ball, this.player)) {
                if (this.ballOwner !== this.player) {
                    console.log('Player hit by ball!');
                    // TODO: Implement life reduction here
                }
            }
        }

        // Update speed meter
        this.updateSpeedMeter();

        // Update debug statistics
        if (this.debugTexts.ballSpeed) {
            const speed = Math.sqrt(Math.pow(this.ball.body.velocity.x, 2) + Math.pow(this.ball.body.velocity.y, 2));
            this.debugTexts.ballSpeed.setText(`Ball Speed: ${Math.round(speed)}`);
            this.debugTexts.ballPos.setText(`Ball Pos: ${Math.round(this.ball.x)},${Math.round(this.ball.y)}`);
            this.debugTexts.playerPos.setText(`Player Pos: ${Math.round(this.player.x)},${Math.round(this.player.y)}`);
            this.debugTexts.playerVel.setText(`Player Vel: ${Math.round(this.player.body.velocity.x)},${Math.round(this.player.body.velocity.y)}`);
        }
    }

    createCoordinateRuler() {
        const gridSize = 100; // Size of each grid cell
        const gridColor = 0x444444;
        const gridAlpha = 0.3;
        const textStyle = { fontSize: '24px', fill: '#666666' };

        // Create grid lines
        const graphics = this.add.graphics();
        graphics.lineStyle(1, gridColor, gridAlpha);

        // Draw vertical lines and x-axis markers
        for (let x = 0; x <= this.game.config.width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.game.config.height);
            this.add.text(x + 5, 5, `x:${x}`, textStyle).setDepth(1);
        }

        // Draw horizontal lines and y-axis markers
        for (let y = 0; y <= this.game.config.height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.game.config.width, y);
            this.add.text(5, y + 5, `y:${y}`, textStyle).setDepth(1);
        }

        graphics.strokePath();
    }
}