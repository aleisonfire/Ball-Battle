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
        const leftPanel = this.add.rectangle(116, 64, leftPanelWidth, this.game.config.height, 0x000000, 0.7);
        leftPanel.setOrigin(0, 0);
        leftPanel.setInteractive({ draggable: true });

        const style = { fontSize: '32px', fill: '#fff' };
        let yPos = 84;

        // Player Speed Input
        const playerSpeedInput = document.createElement('input');
        playerSpeedInput.type = 'number';
        playerSpeedInput.value = this.PLAYER_SPEED;
        playerSpeedInput.style.width = '100px';
        playerSpeedInput.style.fontSize = '24px';
        playerSpeedInput.style.position = 'absolute';
        playerSpeedInput.style.left = '320px';
        playerSpeedInput.style.top = (yPos + 15) + 'px';
        playerSpeedInput.title = 'Player Speed';
        playerSpeedInput.id = 'playerSpeedInput';
        document.playerSpeedInput = playerSpeedInput;
        playerSpeedInput.addEventListener('change', (event) => {
            const newSpeed = parseInt(event.target.value);
            this.PLAYER_SPEED = Phaser.Math.Clamp(newSpeed, 200, 800);
        });
        document.body.appendChild(playerSpeedInput);
        yPos += 40;

        // Width Input
        const playerWidthInput = document.createElement('input');
        playerWidthInput.type = 'number';
        playerWidthInput.value = this.player.width;
        playerWidthInput.style.width = '100px';
        playerWidthInput.style.fontSize = '24px';
        playerWidthInput.style.position = 'absolute';
        playerWidthInput.style.left = '320px';
        playerWidthInput.style.top = (yPos + 15) + 'px';
        playerWidthInput.title = 'Player Width';
        playerWidthInput.id = 'playerWidthInput';
        document.playerWidthInput = playerWidthInput;
        playerWidthInput.addEventListener('change', (event) => {
            const newWidth = parseInt(event.target.value);
            this.player.width = Phaser.Math.Clamp(newWidth, 20, 100);
        });
        document.body.appendChild(playerWidthInput);
        yPos += 40;

        // Height Input
        const playerHeightInput = document.createElement('input');
        playerHeightInput.type = 'number';
        playerHeightInput.value = this.player.height;
        playerHeightInput.style.width = '100px';
        playerHeightInput.style.fontSize = '24px';
        playerHeightInput.style.position = 'absolute';
        playerHeightInput.style.left = '320px';
        playerHeightInput.style.top = (yPos + 15) + 'px';
        playerHeightInput.title = 'Player Height';
        playerHeightInput.id = 'playerHeightInput';
        document.playerHeightInput = playerHeightInput;
        playerHeightInput.addEventListener('change', (event) => {
            const newHeight = parseInt(event.target.value);
            this.player.height = Phaser.Math.Clamp(newHeight, 50, 200);
        });
        document.body.appendChild(playerHeightInput);

        // Update input positions when panel is dragged
        leftPanel.on('drag', (pointer, dragX, dragY) => {
            leftPanel.x = dragX;
            leftPanel.y = dragY;
            const inputs = ['playerSpeedInput', 'playerWidthInput', 'playerHeightInput'];
            inputs.forEach((inputName, index) => {
                const input = document[inputName];
                if (input) {
                    input.style.left = (dragX + 170) + 'px';
                    input.style.top = (dragY + 20 + (index * 40)) + 'px';
                }
            });
        });

        // Right side - Statistics Panel
        const rightPanelWidth = 200;
        const rightPanel = this.add.rectangle(1400, 100, rightPanelWidth, this.game.config.height - 100, 0x000000, 0.7);
        rightPanel.setOrigin(0, 0);
        rightPanel.setInteractive({ draggable: true });
        
        // Create a container for debug texts
        this.debugTextsContainer = this.add.container(1410, 120);
        
        // Add debug texts to the container
        let textYPos = 0;
        this.debugTexts.ballSpeed = this.add.text(0, textYPos, 'Ball Speed: 0', style);
        this.debugTextsContainer.add(this.debugTexts.ballSpeed);
        textYPos += 30;
        
        this.debugTexts.ballPos = this.add.text(0, textYPos, 'Ball Pos: 0,0', style);
        this.debugTextsContainer.add(this.debugTexts.ballPos);
        textYPos += 30;
        
        this.debugTexts.playerPos = this.add.text(0, textYPos, 'Player Pos: 0,0', style);
        this.debugTextsContainer.add(this.debugTexts.playerPos);
        textYPos += 30;
        
        this.debugTexts.playerVel = this.add.text(0, textYPos, 'Player Vel: 0,0', style);
        this.debugTextsContainer.add(this.debugTexts.playerVel);

        // Make right panel draggable and update text positions
        rightPanel.on('drag', (pointer, dragX, dragY) => {
            rightPanel.x = dragX;
            rightPanel.y = dragY;
            this.debugTextsContainer.x = dragX + 10;
            this.debugTextsContainer.y = dragY + 20;
        });
    }

    create() {
        // Create coordinate ruler system
        this.createCoordinateRuler();

        // Create mouse position indicator fixed at bottom right
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        this.mousePositionText = this.add.text(1400, 1000, 'X: 0, Y: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.mousePositionText.setDepth(1000); // Ensure it's always on top
        
        // Add mouse move event listener
        this.input.on('pointermove', (pointer) => {
            this.mousePositionText.setText(`X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`);
        });

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