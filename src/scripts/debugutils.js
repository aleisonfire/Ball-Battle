/**
 * Utility class for debugging purposes
 */
export default class DebugUtils {
    /**
     * Creates a new instance of DebugUtils
     * @param {Phaser.Scene} scene - The scene instance to debug
     */
    constructor(scene) {
        this.scene = scene;
        this.stats = {
            fps: 0,
            playerPosition: { x: 0, y: 0 },
            ballPosition: { x: 0, y: 0 }
        };
    }

    /**
     * Logs debug information to the console
     * @param {any} message - The message to log
     */
    log(message) {
        if (import.meta.env.MODE !== 'production') {
            console.log('[Debug]:', message);
        }
    }

    /**
     * Logs error information to the console
     * @param {Error|string} error - The error to log
     */
    error(error) {
        if (import.meta.env.MODE !== 'production') {
            console.error('[Debug Error]:', error);
        }
    }

    /**
     * Logs warning information to the console
     * @param {string} message - The warning message to log
     */
    warn(message) {
        if (import.meta.env.MODE !== 'production') {
            console.warn('[Debug Warning]:', message);
        }
    }

    /**
     * Updates debug statistics including FPS and object positions
     */
    updateDebugStats() {
        if (import.meta.env.MODE !== 'production') {
            this.stats.fps = Math.round(this.scene.game.loop.actualFps);
            
            if (this.scene.player1) {
                this.stats.playerPosition = {
                    x: Math.round(this.scene.player1.x),
                    y: Math.round(this.scene.player1.y)
                };
            }
            
            if (this.scene.ball) {
                this.stats.ballPosition = {
                    x: Math.round(this.scene.ball.x),
                    y: Math.round(this.scene.ball.y)
                };
            }
            
            console.log('[Debug Stats]:', this.stats);
        }
    }
}