/**
 * AIController class to handle AI player behavior
 */
export default class AIController {
    /**
     * Creates a new instance of AIController
     * @param {Phaser.Scene} scene - The scene instance containing the AI player
     */
    constructor(scene) {
        this.scene = scene;
        this.player = scene.player2;
        this.isEnabled = true;
        this.swingCooldown = false;
        this.decisionTimer = 0;
        this.reactionTime = 300; // milliseconds
        this.difficultyLevel = 0.7; // 0 to 1, higher is more difficult
    }

    /**
     * Sets the AI difficulty level
     * @param {number} level - Difficulty level from 0 to 1
     */
    setDifficultyLevel(level) {
        this.difficultyLevel = level;
    }

    /**
     * Updates AI behavior - called every frame
     * @param {Phaser.GameObjects.Arc} ball - The ball object
     * @param {number} delta - Time elapsed since last frame
     */
    update(ball, delta) {
        if (!this.isEnabled) return;
        
        // Always get the latest player2 reference from the scene
        this.player = this.scene.player2;
        
        // Check if player and ball exist and have physics bodies
        if (!this.player || !this.player.body || !ball || !ball.body) {
            return; // Skip update if player, ball, or their physics bodies are not available
        }
        
        // Update direction indicator position EVERY frame, regardless of decision timer
        this.scene.player2Manager.updateSwingHitboxPosition();
        
        // Update AI decision timer
        this.decisionTimer += delta;
        
        // Only make decisions after reaction time has passed
        if (this.decisionTimer < this.reactionTime) return;
        
        // Reset decision timer
        this.decisionTimer = 0;
        
        // Get ball position and velocity
        const ballX = ball.x;
        const ballY = ball.y;
        const ballVelX = ball.body.velocity.x;
        const ballVelY = ball.body.velocity.y;
        
        // Reset jump count when touching ground
        if (this.player.body.touching.down) {
            this.scene.jumpCount2 = 0;
            this.scene.canJump2 = true;
        }

        // Only react if ball is moving toward AI (positive X velocity)
        if (ballVelX > 0) {
            // Predict where ball will be when it reaches AI's x position
            const timeToReach = (this.player.x - ballX) / ballVelX;
            const predictedY = ballY + (ballVelY * timeToReach);
            
            // Add some randomness based on difficulty level
            const errorMargin = 200 * (1 - this.difficultyLevel);
            const targetY = predictedY + Phaser.Math.Between(-errorMargin, errorMargin);
            
            // Handle jumping only when the ball is significantly above the AI
            if (targetY < this.player.y - 100 && this.scene.canJump2 && this.scene.jumpCount2 < 2) {
                this.player.body.setVelocityY(this.scene.JUMP_VELOCITY);
                this.scene.jumpCount2++;
                this.scene.canJump2 = false;
            }

            // Move horizontally based on ball position with more aggressive movement
            const optimalDistance = 150; // Optimal distance to maintain from the ball
            const currentDistance = this.player.x - ballX;
            
            if (currentDistance > optimalDistance + 50) {
                this.player.body.setVelocityX(-this.scene.PLAYER_SPEED);
                // Update player2's facing direction to left
                this.scene.player2Manager.facingDirection = -1;
            } else if (currentDistance < optimalDistance - 50) {
                this.player.body.setVelocityX(this.scene.PLAYER_SPEED);
                // Update player2's facing direction to right
                this.scene.player2Manager.facingDirection = 1;
            } else {
                this.player.body.setVelocityX(0);
                // Direction stays the same when not moving
            }
            
            // Decide whether to swing based on proximity and difficulty
            const distanceX = Math.abs(this.player.x - ballX);
            const distanceY = Math.abs(this.player.y - ballY);
            
            if (distanceX < 200 && distanceY < 100 && !this.swingCooldown) {
                if (Math.random() < this.difficultyLevel) {
                    this.swing();
                }
            }
        } else {
            // If ball moving away, return to center position
            const centerX = this.scene.game.config.width * 0.8;
            const centerY = 500;
            
            // Move horizontally to center
            if (this.player.x < centerX - 50) {
                this.player.body.setVelocityX(this.scene.PLAYER_SPEED * 0.7);
                // Update player2's facing direction to right when moving right
                this.scene.player2Manager.facingDirection = 1;
            } else if (this.player.x > centerX + 50) {
                this.player.body.setVelocityX(-this.scene.PLAYER_SPEED * 0.7);
                // Update player2's facing direction to left when moving left
                this.scene.player2Manager.facingDirection = -1;
            } else {
                this.player.body.setVelocityX(0);
                // Direction stays the same when not moving
            }
        }
    }

    /**
     * Performs a swing action
     */
    swing() {
        // Use the player2Manager to handle the swing action, just like player1Manager does for player1
        this.scene.player2Manager.startSwing();
        this.swingCooldown = true;
        
        // Reset cooldown after delay
        this.scene.time.delayedCall(this.scene.swingDuration * 1.5, () => {
            this.swingCooldown = false;
        });
    }
}