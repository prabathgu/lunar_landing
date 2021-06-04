
const colors = {
    blue : '#4585BF',
    black : '#000000',
    white : '#FFFFFF',
    gray : '#999999'
}

class Bubble extends Phaser.GameObjects.Container {

    bubbleText // Text on the bubble
    shape // Hit area that will be used for a callback, and also as a template for redrawing the border
    border // Bubble border
    activeColor // Active button color
    scene // Reference to calling scene
    
    constructor(scene, x, y, text, _textSettings = {}) {
        super(scene, x, y)
        this.scene = scene

        let textSettings = {
            color : _textSettings.color ?? colors.blue,
            fontSize : _textSettings.fontSize ?? 40,
            fontFamily : _textSettings.fontFamily ?? 'Helvetica Neue'
        }
        let padX = _textSettings.padX ?? (_textSettings.pad ?? 20)
        let padY = _textSettings.padY ?? (_textSettings.pad ?? 10)

        this.bubbleText = scene.add.text(0, 0, text, textSettings)

        let bounds = this.bubbleText.getBounds()

        this.shape = scene.add.rectangle(-padX, -padY, bounds.width + padX * 2, bounds.height + padY * 2).setOrigin(0,0)

        // Add the children in the correct order to the container
        // First the border, then the text and finally the hit area shape.
        this.activeColor = textSettings.color
        this._drawBorder(this.activeColor)
        this.add(this.bubbleText)
        this.add(this.shape)

        this.scene.add.existing(this)
    }

    _drawBorder(color) {
        let newBorder = this.scene.add.graphics()
        //  Bubble color
        newBorder.fillStyle(Phaser.Display.Color.ValueToColor(colors.white).color, 1)
        //  Bubble outline line style
        newBorder.lineStyle(6, Phaser.Display.Color.ValueToColor(color).color, 10)
        //  Bubble shape and outline
        // The border can be re-drawn based on the underlying this.shape
        newBorder.strokeRoundedRect(this.shape.x, this.shape.y, this.shape.width, this.shape.height, 16)
        newBorder.fillRoundedRect(this.shape.x, this.shape.y, this.shape.width, this.shape.height, 16)
        if (this.border) {
            this.replace(this.border, newBorder, true)
        } else {
            this.add(newBorder)
        }
        this.border = newBorder
    }

    setCallback(callback) {
        // We enable the bubble as a button as soon as the callback is set.
        // enable() and disable() methods can be used to change this later.
        this.shape.setInteractive({ useHandCursor: true })
        this.shape.on('pointerdown', callback)
        return this
    }

    enable() {
        this.shape.setInteractive({ useHandCursor: true })
        this._drawBorder(this.activeColor)
        this.bubbleText.setColor(this.activeColor)
        return this
    }

    disable() {
        this.shape.disableInteractive()
        this._drawBorder(colors.gray)
        this.bubbleText.setColor(colors.gray)
        return this
    }

    setText(str) {
        this.bubbleText.setText(str)
    }

    destroyOnClick() {
        this.enable()
        this.shape.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation()
        })
        this.shape.on('pointerup', (pointer, localX, localY, event) => {
            event.stopPropagation()
            this.destroy()
        })
    }
}