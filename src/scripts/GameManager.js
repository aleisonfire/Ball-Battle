/**
 * GameManager class to handle game state and UI management
 */
export default class GameManager {
    /**
     * Creates a new instance of GameManager
     * @param {Phaser.Scene} scene - The scene instance containing the game
     */
    constructor(scene) {
        this.scene = scene;
        this.player1Lives = 5;
        this.player2Lives = 5;
        this.roundCounter = 1;
        this.isFirstRound = true;
        this.player1LivesText = null;
        this.player2LivesText = null;
        this.roundCounterText = null;
        this.speedMeter = null;
        this.speedMeterFill = null;
        this.speedText = null;
        this.MAX_BALL_SPEED = Number.MAX_SAFE_INTEGER;
    }

    /**
     * Initializes the game UI elements
     */
    init() {
        // Create player lives UI
        this.player1LivesText = this.scene.add.text(50, 100, `Player 1: ${this.player1Lives} ❤️`, {
            fontSize: '32px',
            fill: '#00ff00'
        });
        
        this.player2LivesText = this.scene.add.text(this.scene.game.config.width - 250, 100, `Player 2: ${this.player2Lives} ❤️`, {
            fontSize: '32px',
            fill: '#0000ff'
        });
        
        // Create round counter UI
        this.roundCounterText = this.scene.add.text(this.scene.game.config.width / 2, 100, `Round: ${this.roundCounter}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Create speed meter UI
        this.createSpeedMeter();
    }

    /**
     * Creates the speed meter UI elements
     */
    createSpeedMeter() {
        const meterWidth = 200;
        const meterHeight = 20;
        const meterX = this.scene.game.config.width / 2 - meterWidth / 2;
        const meterY = 30;

        // Create meter background
        this.speedMeter = this.scene.add.rectangle(meterX, meterY, meterWidth, meterHeight, 0x333333);
        this.speedMeter.setOrigin(0, 0);

        // Create meter fill
        this.speedMeterFill = this.scene.add.rectangle(meterX, meterY, 0, meterHeight, 0x00ff00);
        this.speedMeterFill.setOrigin(0, 0);

        // Add speed text
        this.speedText = this.scene.add.text(meterX + meterWidth / 2, meterY + meterHeight + 5, '0 px/s', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5, 0);
    }

    /**
     * Updates the speed meter display
     * @param {Phaser.GameObjects.Arc} ball - The ball object
     */
    updateSpeedMeter(ball) {
        // Calculate current ball speed
        const currentSpeed = Math.sqrt(Math.pow(ball.body.velocity.x, 2) + Math.pow(ball.body.velocity.y, 2));
        
        // Update meter fill width based on speed
        const fillWidth = (currentSpeed / this.MAX_BALL_SPEED) * this.speedMeter.width;
        this.speedMeterFill.width = fillWidth;

        // Update fill color based on speed
        let fillColor;
        if (currentSpeed < this.scene.BALL_SPEED) {
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

    /**
     * Handles player being hit by ball and updates lives
     * @param {Phaser.GameObjects.Rectangle} player - The player that was hit
     * @param {Function} resetBallCallback - Callback to reset ball position
     * @returns {boolean} Whether the game is over
     */
    handlePlayerHit(player, resetBallCallback) {
        const isPlayer1 = player === this.scene.player1;
        
        if (isPlayer1) {
            this.player1Lives--;
            this.player1LivesText.setText(`Player 1: ${this.player1Lives} ❤️`);
            
            if (this.player1Lives <= 0) {
                this.showGameOver('Game Over - Player 2 Wins!');
                return true;
            }
        } else {
            this.player2Lives--;
            this.player2LivesText.setText(`Player 2: ${this.player2Lives} ❤️`);
            
            if (this.player2Lives <= 0) {
                this.showGameOver('Game Over - Player 1 Wins!');
                return true;
            }
        }
        
        // Update round first then reset ball
        this.updateRoundCounter(false);
        resetBallCallback(player);
        return false;
    }

    /**
     * Shows game over message and resets game state
     * @param {string} message - The game over message to display
     */
    showGameOver(message) {
        this.updateRoundCounter(true);
        const gameOverText = this.scene.add.text(this.scene.game.config.width / 2, this.scene.game.config.height / 2, message, {
            fontSize: '64px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // Reset game after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            gameOverText.destroy();
            this.resetLives();
            this.scene.resetBallPosition();
        });
    }

    /**
     * Resets player lives to initial values
     */
    resetLives() {
        this.player1Lives = 5;
        this.player2Lives = 5;
        this.player1LivesText.setText(`Player 1: ${this.player1Lives} ❤️`);
        this.player2LivesText.setText(`Player 2: ${this.player2Lives} ❤️`);
    }

    /**
     * Updates the round counter
     * @param {boolean} isReset - Whether this is a game reset
     */
    updateRoundCounter(isReset) {
        if (isReset) {
            this.roundCounter = 1;
            this.isFirstRound = true;
        } else {
            this.roundCounter++;
            this.isFirstRound = false;
        }
        
        this.roundCounterText.setText(`Round: ${this.roundCounter}`);
    }
}