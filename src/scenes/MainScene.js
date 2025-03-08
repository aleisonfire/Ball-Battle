import Phaser from 'phaser';
import DebugUtils from '/scripts/DebugUtils';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.ball = null;
        this.player1 = null;
        this.player2 = null;
        this.BALL_SPEED = 300;
        this.PLAYER_SPEED = 800;
        this.JUMP_VELOCITY = -900;
        this.cursors = null;
        this.canJump1 = true;
        this.canJump2 = true;
        this.jumpCount1 = 0;
        this.jumpCount2 = 0;
        this.swingHitbox = null;
        this.isSwinging = false;
        this.swingDuration = 300;
        this.swingCooldown = false;
        this.MAX_BALL_SPEED = Number.MAX_SAFE_INTEGER;
        this.speedMeter = null;
        this.speedMeterFill = null;
        // Life system properties
        this.player1Lives = 5;
        this.player2Lives = 5;
        this.player1LivesText = null;
        this.player2LivesText = null;
        // Hit stop effect properties
        this.HIT_STOP_THRESHOLD = 3500;
        this.BASE_HIT_STOP_DURATION = 600;
        this.hitStopCount = 0;
        this.isHitStopped = false;
        this.gameStarted = false;
        this.firstHit = false; // Track if the first hit has occurred
        
        // AI properties
        this.isAIEnabled = true;
        this.aiSwingCooldown = false;
        this.aiDecisionTimer = 0;
        this.aiReactionTime = 300; // milliseconds
        this.aiDifficultyLevel = 0.7; // 0 to 1, higher is more difficult

        // Debug utils
        this.debugUtils = null;
    }

    preload() {
        // No need to create circle in preload
    }

    create() {
        // Initialize debug utils but don't create debug elements
        this.debugUtils = new DebugUtils(this);
        
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

        // Create player lives UI
        this.player1LivesText = this.add.text(50, 100, `Player 1: ${this.player1Lives} ❤️`, {
            fontSize: '32px',
            fill: '#00ff00'
        });
        
        this.player2LivesText = this.add.text(this.game.config.width - 250, 100, `Player 2: ${this.player2Lives} ❤️`, {
            fontSize: '32px',
            fill: '#0000ff'
        });
        
        // Create the ball sprite with physics
        this.ball = this.add.circle(900, 600, 10, 0xffffff);
        this.physics.add.existing(this.ball);

        // Set ball properties
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setBounce(1, 1);
        // Make ball stationary at start
        this.ball.body.setVelocity(0, 0);

        // Set gameStarted to true but don't move the ball yet
        // The ball will only move after the first hit
        this.gameStarted = true;

        // Remove maximum velocity limit to allow continuous speed increase
        this.ball.body.setMaxVelocity(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

        // Create player 1
        this.player1 = this.add.rectangle(400, 500, 50, 200, 0x00ff00);
        this.player1.fillColor = 0x00ff00; // Store color for ball ownership
        this.physics.add.existing(this.player1, false);
        this.player1.body.setCollideWorldBounds(true);
        this.jumpCount1 = 0;
        this.player1.body.setGravityY(2000);
        this.player1.body.setFriction(0);
        this.player1.body.setDragX(0);

        // Create player 2
        this.player2 = this.add.rectangle(1520, 500, 50, 200, 0x0000ff);
        this.player2.fillColor = 0x0000ff; // Store color for ball ownership
        this.physics.add.existing(this.player2, false);
        this.player2.body.setCollideWorldBounds(true);
        this.jumpCount2 = 0;
        this.player2.body.setGravityY(2000);
        this.player2.body.setFriction(0);
        this.player2.body.setDragX(0);
        
        // Create ground collision detection
        const ground = this.add.rectangle(960, 900, 1920, 20, 0x666666);
        this.physics.add.existing(ground, true);
        this.physics.add.collider(this.player1, ground);
        this.physics.add.collider(this.player2, ground);

        // Debug visualization - disabled
        // this.physics.world.createDebugGraphic();

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

        // Create debug menu - disabled
        // this.debugUtils.createDebugMenu();

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add collision detection between ball and swing hitbox
        this.physics.add.overlap(this.ball, this.swingHitbox, this.handleBallHit, null, this);

        // Track ball ownership and active player
        this.ballOwner = null;
        this.player = this.player1; // Player1 is always the human player
        this.jumpCount = this.jumpCount1; // Set initial jumpCount
        this.canJump = this.canJump1; // Set initial canJump
        
        // Add AI difficulty selector
        this.createAIDifficultySelector();
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
            // Set firstHit to true if this is the first hit
            if (!this.firstHit) {
                this.firstHit = true;
            }
            
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
    
            // Update ball ownership and color
            this.ballOwner = this.player;
            this.ball.setFillStyle(this.player.fillColor); // Set ball color to match player color

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

    checkBallCollisions() {
      // Check collision with player1
      if (this.physics.overlap(this.ball, this.player1) && this.ballOwner !== this.player1) {
        console.log('Player 1 hit by ball!');
        this.player1Lives--;
        this.player1LivesText.setText(`Player 1: ${this.player1Lives} ❤️`);
        
        if (this.player1Lives <= 0) {
          // Game over - Player 2 wins
          const gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'Game Over - Player 2 Wins!', {
            fontSize: '64px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
          }).setOrigin(0.5);
          
          // Reset game after 2 seconds
          this.time.delayedCall(2000, () => {
            gameOverText.destroy();
            this.player1Lives = 5;
            this.player2Lives = 5;
            this.player1LivesText.setText(`Player 1: ${this.player1Lives} ❤️`);
            this.player2LivesText.setText(`Player 2: ${this.player2Lives} ❤️`);
            this.resetBallPosition();
          });
        } else {
          this.resetBallPosition();
        }
      }
      
      // Check collision with player2
      if (this.physics.overlap(this.ball, this.player2) && this.ballOwner !== this.player2) {
        console.log('Player 2 hit by ball!');
        this.player2Lives--;
        this.player2LivesText.setText(`Player 2: ${this.player2Lives} ❤️`);
        
        if (this.player2Lives <= 0) {
          // Game over - Player 1 wins
          const gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'Game Over - Player 1 Wins!', {
            fontSize: '64px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
          }).setOrigin(0.5);
          
          // Reset game after 2 seconds
          this.time.delayedCall(2000, () => {
            gameOverText.destroy();
            this.player1Lives = 5;
            this.player2Lives = 5;
            this.player1LivesText.setText(`Player 1: ${this.player1Lives} ❤️`);
            this.player2LivesText.setText(`Player 2: ${this.player2Lives} ❤️`);
            this.resetBallPosition();
          });
        } else {
          this.resetBallPosition();
        }
      }
    }
    
    resetBallPosition() {
        // Reset ball to center with default speed
        this.ball.x = this.game.config.width / 2;
        this.ball.y = this.game.config.height / 2;
        
        // Give the ball a random direction at default speed
        const angle = Phaser.Math.Between(-60, 60);
        const angleRad = Phaser.Math.DegToRad(angle);
        
        this.ball.body.setVelocity(
            Math.cos(angleRad) * this.BALL_SPEED,
            Math.sin(angleRad) * this.BALL_SPEED
        );
        
        // Reset ball ownership and color
        this.ballOwner = null;
        this.ball.setFillStyle(0xffffff); // Reset to white color
    }
    
    createAIDifficultySelector() {
        // Create difficulty text
        this.add.text(50, 30, 'AI Difficulty:', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // Create difficulty slider
        const sliderTrack = this.add.rectangle(200, 45, 200, 10, 0x666666);
        sliderTrack.setOrigin(0, 0.5);
        
        // Create slider handle
        const sliderHandle = this.add.rectangle(200 + (this.aiDifficultyLevel * 200), 45, 20, 30, 0xffffff);
        sliderHandle.setOrigin(0.5, 0.5);
        sliderHandle.setInteractive({ draggable: true });
        
        // Create difficulty level text
        const difficultyText = this.add.text(420, 45, `${Math.round(this.aiDifficultyLevel * 100)}%`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
        
        // Handle slider drag
        sliderHandle.on('drag', (pointer, dragX) => {
            // Constrain handle to track
            const x = Phaser.Math.Clamp(dragX, 200, 400);
            sliderHandle.x = x;
            
            // Update difficulty level (0 to 1)
            this.aiDifficultyLevel = (x - 200) / 200;
            difficultyText.setText(`${Math.round(this.aiDifficultyLevel * 100)}%`);
        });
    }
    
    updateAI() {
        if (!this.isAIEnabled) return;
        
        // Update AI decision timer
        this.aiDecisionTimer += this.game.loop.delta;
        
        // Only make decisions after reaction time has passed
        if (this.aiDecisionTimer < this.aiReactionTime) return;
        
        // Reset decision timer
        this.aiDecisionTimer = 0;
        
        // Get ball position and velocity
        const ballX = this.ball.x;
        const ballY = this.ball.y;
        const ballVelX = this.ball.body.velocity.x;
        const ballVelY = this.ball.body.velocity.y;
        
        // Reset jump count when touching ground
        if (this.player2.body.touching.down) {
            this.jumpCount2 = 0;
            this.canJump2 = true;
        }

        // Only react if ball is moving toward AI (positive X velocity)
        if (ballVelX > 0) {
            // Predict where ball will be when it reaches AI's x position
            const timeToReach = (this.player2.x - ballX) / ballVelX;
            const predictedY = ballY + (ballVelY * timeToReach);
            
            // Add some randomness based on difficulty level
            const errorMargin = 200 * (1 - this.aiDifficultyLevel);
            const targetY = predictedY + Phaser.Math.Between(-errorMargin, errorMargin);
            
            // Handle jumping only when the ball is significantly above the AI
            if (targetY < this.player2.y - 100 && this.canJump2 && this.jumpCount2 < 2) {
                this.player2.body.setVelocityY(this.JUMP_VELOCITY);
                this.jumpCount2++;
                this.canJump2 = false;
            }

            // Move horizontally based on ball position with more aggressive movement
            const optimalDistance = 150; // Optimal distance to maintain from the ball
            const currentDistance = this.player2.x - ballX;
            
            if (currentDistance > optimalDistance + 50) {
                this.player2.body.setVelocityX(-this.PLAYER_SPEED);
            } else if (currentDistance < optimalDistance - 50) {
                this.player2.body.setVelocityX(this.PLAYER_SPEED);
            } else {
                this.player2.body.setVelocityX(0);
            }
            
            // Decide whether to swing based on proximity and difficulty
            const distanceX = Math.abs(this.player2.x - ballX);
            const distanceY = Math.abs(this.player2.y - ballY);
            
            if (distanceX < 200 && distanceY < 100 && !this.aiSwingCooldown) {
                if (Math.random() < this.aiDifficultyLevel) {
                    this.aiSwing();
                }
            }
        } else {
            // If ball moving away, return to center position
            const centerX = this.game.config.width * 0.8;
            const centerY = 500;
            
            // Move horizontally to center
            if (this.player2.x < centerX - 50) {
                this.player2.body.setVelocityX(this.PLAYER_SPEED * 0.7);
            } else if (this.player2.x > centerX + 50) {
                this.player2.body.setVelocityX(-this.PLAYER_SPEED * 0.7);
            } else {
                this.player2.body.setVelocityX(0);
            }
            
            // Only jump to return to center height if too high
            if (this.player2.y < centerY - 100) {
                // Let gravity bring the AI down naturally
                // No need to set vertical velocity
            }
        }
    }
    
    aiSwing() {
        // Create a temporary swing hitbox for AI
        const aiSwingHitbox = this.add.rectangle(this.player2.x - 75, this.player2.y, 150, 40, 0xff0000);
        this.physics.add.existing(aiSwingHitbox, false);
        aiSwingHitbox.visible = true;
        
        // Set AI swing cooldown
        this.aiSwingCooldown = true;
        
        // Add collision detection for AI swing
        const aiSwingCollider = this.physics.add.overlap(this.ball, aiSwingHitbox, (ball, hitbox) => {
            // Set firstHit to true if this is the first hit
            if (!this.firstHit) {
                this.firstHit = true;
            }
            
            // Calculate impact point and new direction
            const impactPoint = (ball.y - hitbox.y) / hitbox.height;
            const angle = -75 + (impactPoint * 150);
            const angleRad = Phaser.Math.DegToRad(angle);
    
            // Get current speed
            const currentSpeed = Math.sqrt(Math.pow(ball.body.velocity.x, 2) + Math.pow(ball.body.velocity.y, 2));
            
            // Calculate speed increase
            const baseIncrease = Math.max(currentSpeed * 0.3, 100);
            const newSpeed = currentSpeed + baseIncrease;
    
            // Set new velocity components while maintaining the calculated angle
            const velocityX = -Math.abs(Math.cos(angleRad) * newSpeed); // Force negative X to go toward player
            const velocityY = Math.sin(angleRad) * newSpeed;
            
            // Apply velocity
            ball.body.setVelocity(velocityX, velocityY);
    
            // Update ball ownership and color
            this.ballOwner = this.player2;
            this.ball.setFillStyle(this.player2.fillColor); // Set ball color to match AI player color
            
            // Check for hit stop effect
            if (newSpeed > this.HIT_STOP_THRESHOLD && !this.isHitStopped) {
                this.isHitStopped = true;
                this.hitStopCount++;
                
                // Calculate hit stop duration
                const hitStopDuration = this.BASE_HIT_STOP_DURATION + (this.hitStopCount * 100);
                
                // Store current velocities
                const storedVelocityX = ball.body.velocity.x;
                const storedVelocityY = ball.body.velocity.y;
                
                // Freeze objects
                ball.body.enable = false;
                
                // Resume normal physics after the hit stop duration
                this.time.addEvent({
                    delay: hitStopDuration,
                    callback: () => {
                        // Re-enable physics bodies
                        ball.body.enable = true;
                        
                        // Restore velocities
                        ball.body.setVelocity(storedVelocityX, storedVelocityY);
                        this.isHitStopped = false;
                    },
                    callbackScope: this
                });
            }
        }, null, this);
        
        // Remove hitbox and collider after duration
        this.time.delayedCall(this.swingDuration, () => {
            aiSwingHitbox.destroy();
            this.physics.world.removeCollider(aiSwingCollider);
        });
        
        // Reset AI swing cooldown after delay
        this.time.delayedCall(this.swingDuration * 2, () => {
            this.aiSwingCooldown = false;
        });
    }

    update() {
        if (!this.isHitStopped) {
            // Handle human player (player1) controls
            if (this.cursors.left.isDown) {
                this.player1.body.setVelocityX(-this.PLAYER_SPEED);
            } else if (this.cursors.right.isDown) {
                this.player1.body.setVelocityX(this.PLAYER_SPEED);
            } else {
                this.player1.body.setVelocityX(0);
            }

            // Reset jump count when touching ground
            if (this.player1.body.touching.down) {
                this.jumpCount1 = 0;
                this.jumpCount = this.jumpCount1;
            }

            // Handle human player jumping
            if (this.cursors.up.isDown && this.canJump1 && this.jumpCount1 < 2) {
                this.player1.body.setVelocityY(this.JUMP_VELOCITY);
                this.canJump1 = false;
                this.jumpCount1++;
            }

            if (this.cursors.up.isUp) {
                this.canJump1 = true;
            }

            // Handle human player swinging
            if (this.cursors.down.isDown && !this.swingCooldown) {
                this.player = this.player1;
                this.startSwing();
            }

            // Update swing hitbox position if swinging
            if (this.isSwinging) {
                this.updateSwingHitboxPosition();
            }

            // Update AI behavior
            this.updateAI();

            // Handle ball-player collision based on ownership
            this.checkBallCollisions();
        }

        // Update speed meter
        this.updateSpeedMeter();

        // Update debug statistics
        this.debugUtils.updateDebugStats();
    }
}