/**
 * Ball class to handle ball behavior and physics
 */
export default class Ball {
    /**
     * Creates a new instance of Ball
     * @param {Phaser.Scene} scene - The scene instance containing the ball
     */
    constructor(scene) {
        this.scene = scene;
        this.ball = null;
        this.ballOwner = null;
        this.firstHit = false;
    }

    /**
     * Creates and initializes the ball
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {number} radius - Ball radius
     * @param {number} color - Ball color
     */
    create(x = 900, y = 600, radius = 30, color = 0xffffff) {
        this.ball = this.scene.add.circle(x, y, radius, color);
        this.scene.physics.add.existing(this.ball);
        this.ball.setDepth(1);  // Add depth setting

        // Set ball properties
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setBounce(1, 1);
        
        // Make ball stationary at start
        this.ball.body.setVelocity(0, 0);

        // Remove maximum velocity limit to allow continuous speed increase
        this.ball.body.setMaxVelocity(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        
        // Ensure the ball is visible
        this.ball.visible = true;
        this.ball.setAlpha(1);
        
        // Ensure the ball is on top of the display list
        this.scene.children.bringToTop(this.ball);

        return this.ball;
    }

    /**
     * Handles ball hit by a player's swing
     * @param {Phaser.GameObjects.Rectangle} player - The player that hit the ball
     * @param {Phaser.GameObjects.Rectangle} hitbox - The swing hitbox
     */
    handleHit(player, hitbox) {
        // Set firstHit to true if this is the first hit
        if (!this.firstHit) {
            this.firstHit = true;
        }
        
        // Calculate impact point and new direction based on semicircular hitbox
        // Get the angle between ball and hitbox center
        const dx = this.ball.x - hitbox.x;
        const dy = this.ball.y - hitbox.y;
        
        // Calculate impact point based on position in the semicircle
        // This maps the position to a value between -1 and 1
        const impactPoint = Math.atan2(dy, dx) / Math.PI;
        
        // Calculate angle based on impact point
        const angle = -75 + (impactPoint * 150);
        const angleRad = Phaser.Math.DegToRad(angle);

        // Get current speed
        const currentSpeed = Math.sqrt(Math.pow(this.ball.body.velocity.x, 2) + Math.pow(this.ball.body.velocity.y, 2));
        
        // Calculate speed increase with a more aggressive boost
        const baseIncrease = Math.max(currentSpeed * 0.3, 100);
        const newSpeed = currentSpeed + baseIncrease;

        // Set new velocity components while maintaining the calculated angle
        const velocityX = Math.cos(angleRad) * newSpeed;
        const velocityY = Math.sin(angleRad) * newSpeed;
        
        // Apply velocity
        this.ball.body.setVelocity(velocityX, velocityY);

        // Update ball ownership and color
        this.ballOwner = player;
        this.ball.setFillStyle(player.fillColor); // Set ball color to match player color

        // Check if speed exceeds threshold for hit stop effect
        if (newSpeed > this.scene.HIT_STOP_THRESHOLD && !this.scene.isHitStopped) {
            this.applyHitStopEffect(player);
        }

        return newSpeed;
    }

    /**
     * Applies hit stop effect when ball is hit at high speed
     * @param {Phaser.GameObjects.Rectangle} player - The player that hit the ball
     */
    applyHitStopEffect(player) {
        this.scene.isHitStopped = true;
        this.scene.hitStopCount++;
        
        // Calculate hit stop duration with slight increase for each hit
        const hitStopDuration = this.scene.BASE_HIT_STOP_DURATION + (this.scene.hitStopCount * 100);
        
        // Store current velocities
        const storedVelocityX = this.ball.body.velocity.x;
        const storedVelocityY = this.ball.body.velocity.y;
        const storedPlayerVelocityX = player.body.velocity.x;
        const storedPlayerVelocityY = player.body.velocity.y;
        
        // Completely freeze both objects by disabling their physics bodies
        this.ball.body.enable = false;
        player.body.enable = false;
        
        // Resume normal physics after the hit stop duration
        this.scene.time.addEvent({
            delay: hitStopDuration,
            callback: () => {
                // Re-enable physics bodies
                this.ball.body.enable = true;
                player.body.enable = true;
                
                // Restore velocities
                this.ball.body.setVelocity(storedVelocityX, storedVelocityY);
                player.body.setVelocity(storedPlayerVelocityX, storedPlayerVelocityY);
                this.scene.isHitStopped = false;
            },
            callbackScope: this.scene
        });
    }

    /**
     * Checks for collisions between the ball and players
     * @param {Phaser.GameObjects.Rectangle} player1 - Player 1
     * @param {Phaser.GameObjects.Rectangle} player2 - Player 2
     */
    checkPlayerCollisions(player1, player2) {
        // Check collision with player1
        if (this.scene.physics.overlap(this.ball, player1) && this.ballOwner !== player1 && this.ballOwner !== null) {
            console.log('Player 1 hit by ball!');
            // Use GameManager to handle player hit and lives
            const gameOver = this.scene.gameManager.handlePlayerHit(player1, (p) => this.resetPosition(p));
        }
        
        // Check collision with player2
        if (this.scene.physics.overlap(this.ball, player2) && this.ballOwner !== player2 && this.ballOwner !== null) {
            console.log('Player 2 hit by ball!');
            // Use GameManager to handle player hit and lives
            const gameOver = this.scene.gameManager.handlePlayerHit(player2, (p) => this.resetPosition(p));
        }
    }

    /**
     * Resets the ball position after a player loses a life
     * @param {Phaser.GameObjects.Rectangle} playerLostLife - The player that lost a life
     */
    resetPosition(playerLostLife = null) {
        // Hide the ball initially
        this.ball.visible = false;
        this.ball.setAlpha(1); // Ensure alpha is reset
        
        // Position the ball based on whether it's the first round or not
        if (this.scene.gameManager.isFirstRound) {
            // First round: ball spawns in the middle
            this.ball.x = this.scene.game.config.width / 2;
            this.ball.y = this.scene.game.config.height / 2;
        } else if (playerLostLife) {
            // Subsequent rounds: ball spawns on the side of the player who lost
            if (playerLostLife === this.scene.player1) {
                // Player 1 (green) lost, spawn at specific coordinates
                this.ball.x = 50;
                this.ball.y = 750;
                console.log('Spawning ball on Player 1 side (round:', this.scene.gameManager.roundCounter, ')');
            } else {
                // Player 2 (blue) lost, spawn at specific coordinates
                this.ball.x = 1885;
                this.ball.y = 750;
                console.log('Spawning ball on Player 2 side (round:', this.scene.gameManager.roundCounter, ')');
            }
        } else {
            // Default case: ball spawns in the middle
            this.ball.x = this.scene.game.config.width / 2;
            this.ball.y = this.scene.game.config.height / 2;
        }
        
        // Stop any current ball movement
        this.ball.body.setVelocity(0, 0);
        
        // Create countdown text
        const countdownText = this.scene.add.text(this.scene.game.config.width / 2, this.scene.game.config.height / 2 - 100, 'Ball appears in: 3', {
            fontSize: '48px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // Start countdown sequence
        let timeLeft = 3;
        
        const countdownTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                if (timeLeft > 0) {
                    countdownText.setText(`Ball appears in: ${timeLeft}`);
                } else {
                    // When countdown finishes, show the ball and set its velocity
                    countdownText.destroy();
                    this.ball.visible = true;
                    this.scene.children.bringToTop(this.ball); // Ensure ball render order
                    
                    // Set ball velocity to zero
                    this.ball.body.setVelocity(0, 0);
                    
                    // Set ball ownership to the player who lost a life
                    if (playerLostLife) {
                        this.ballOwner = playerLostLife;
                        this.ball.setFillStyle(playerLostLife.fillColor); // Set ball color to match player color
                    } else {
                        // Reset ball ownership and color if no player specified
                        this.ballOwner = null;
                        this.ball.setFillStyle(0xffffff); // Reset to white color
                    }
                }
            },
            callbackScope: this.scene,
            repeat: 2  // Changed from 3 to 2 to have exactly 3 countdown steps
        });
    }

    /**
     * Updates the ball behavior - called every frame
     */
    update() {
        // Ensure ball doesn't stop in the UI region (x:0-500, y:0-160)
        if (this.ball.x < 500 && this.ball.y < 160 && this.ball.body.velocity.lengthSq() === 0) {
            // If ball has stopped in this region, give it a small velocity to escape
            const angle = Phaser.Math.Between(0, 360);
            const velocity = 200;
            this.ball.body.setVelocity(
                Math.cos(Phaser.Math.DegToRad(angle)) * velocity,
                Math.sin(Phaser.Math.DegToRad(angle)) * velocity
            );
        }
    }

    /**
     * Gets the current ball speed
     * @returns {number} Current ball speed
     */
    getSpeed() {
        return Math.sqrt(Math.pow(this.ball.body.velocity.x, 2) + Math.pow(this.ball.body.velocity.y, 2));
    }
}