import Phaser from 'phaser';

export default class DebugUtils {
    constructor(scene) {
        this.scene = scene;
        this.debugTexts = {};
        this.debugTextsContainer = null;
    }

    createDebugMenu() {
        this.createDebugControlPanel();
        this.createDebugStatsPanel();
    }

    createDebugControlPanel() {
        // Left side - Control Panel
        const leftPanelWidth = 200;
        const leftPanel = this.scene.add.rectangle(116, 64, leftPanelWidth, this.scene.game.config.height, 0x000000, 0.7);
        leftPanel.setOrigin(0, 0);
        leftPanel.setInteractive({ draggable: true });
    }

    createDebugInputs(panel) {
        // Empty implementation since we're removing input boxes
        return [];
    }

    createDebugInput(id, type, value, yPos, changeHandler) {
        // Empty implementation since we're removing input boxes
        return null;
    }

    createDebugStatsPanel() {
        // Right side - Statistics Panel
        const style = { fontSize: '32px', fill: '#fff' };
        const rightPanelWidth = 200;
        const rightPanel = this.scene.add.rectangle(1400, 100, rightPanelWidth, this.scene.game.config.height - 100, 0x000000, 0.7);
        rightPanel.setOrigin(0, 0);
        rightPanel.setInteractive({ draggable: true });
        
        // Create a container for debug texts
        this.debugTextsContainer = this.scene.add.container(1410, 120);
        
        // Add debug texts to the container
        let textYPos = 0;
        this.debugTexts.ballSpeed = this.scene.add.text(0, textYPos, 'Ball Speed: 0', style);
        this.debugTextsContainer.add(this.debugTexts.ballSpeed);
        textYPos += 30;
        
        this.debugTexts.ballPos = this.scene.add.text(0, textYPos, 'Ball Pos: 0,0', style);
        this.debugTextsContainer.add(this.debugTexts.ballPos);
        textYPos += 30;
        
        this.debugTexts.playerPos = this.scene.add.text(0, textYPos, 'Player Pos: 0,0', style);
        this.debugTextsContainer.add(this.debugTexts.playerPos);
        textYPos += 30;
        
        this.debugTexts.playerVel = this.scene.add.text(0, textYPos, 'Player Vel: 0,0', style);
        this.debugTextsContainer.add(this.debugTexts.playerVel);

        // Make right panel draggable and update text positions
        rightPanel.on('drag', (pointer, dragX, dragY) => {
            rightPanel.x = dragX;
            rightPanel.y = dragY;
            this.debugTextsContainer.x = dragX + 10;
            this.debugTextsContainer.y = dragY + 20;
        });
    }

    createCoordinateRuler() {
        const gridSize = 100; // Size of each grid cell
        const gridColor = 0x444444;
        const gridAlpha = 0.3;
        const textStyle = { fontSize: '24px', fill: '#666666' };

        // Create grid lines
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(1, gridColor, gridAlpha);

        // Draw vertical lines and x-axis markers
        for (let x = 0; x <= this.scene.game.config.width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scene.game.config.height);
            this.scene.add.text(x + 5, 5, `x:${x}`, textStyle).setDepth(1);
        }

        // Draw horizontal lines and y-axis markers
        for (let y = 0; y <= this.scene.game.config.height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scene.game.config.width, y);
            this.scene.add.text(5, y + 5, `y:${y}`, textStyle).setDepth(1);
        }

        graphics.strokePath();
    }

    updateDebugStats() {
        if (this.debugTexts.ballSpeed) {
            const speed = Math.sqrt(Math.pow(this.scene.ball.body.velocity.x, 2) + Math.pow(this.scene.ball.body.velocity.y, 2));
            this.debugTexts.ballSpeed.setText(`Ball Speed: ${Math.round(speed)}`);
            this.debugTexts.ballPos.setText(`Ball Pos: ${Math.round(this.scene.ball.x)},${Math.round(this.scene.ball.y)}`);
            this.debugTexts.playerPos.setText(`Player Pos: ${Math.round(this.scene.player.x)},${Math.round(this.scene.player.y)}`);
            this.debugTexts.playerVel.setText(`Player Vel: ${Math.round(this.scene.player.body.velocity.x)},${Math.round(this.scene.player.body.velocity.y)}`);
        }
    }
}