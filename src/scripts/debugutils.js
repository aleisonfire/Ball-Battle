/**
 * Simplified utility class for debugging purposes
 */
export default class DebugUtils {
    /**
     * Creates a new instance of DebugUtils
     * @param {Phaser.Scene} scene - The scene instance to debug
     */
    constructor(scene) {
        this.scene = scene;
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
     * Updates debug statistics - called every frame
     * This method was missing and causing the black screen
     */
    updateDebugStats() {
        console.log('[Debug] Stats update cycle');
        // Can be expanded later with actual debug statistics
    }
}