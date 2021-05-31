
const cards =      ['Constellation_Map', 'Dehydrated_Milk',
                    'First_Aid_Kit', 'Food_Concentrate',
                    'Life_Raft', 'Magnetic_Compass',
                    'Matches', 'Nylon_Rope',
                    'Oxygen', 'Parachute_Silk',
                    'Portable_Heating_Unit', 'Signal_Flare',
                    'Two-Way_Radio', 'Water']

var selected // The currently selected piece
var rotator // The rotation widget

var isMoving // Set to true when a piece is moved
var isBackgroundClick // Set to true when user clicks on the clear background

class Title extends Phaser.Scene {
    constructor() {
        super('title')
    }

    preload () {
        this.load.image('title', 'title.png')
    }

    create() {
        let { width, height } = this.sys.game.canvas
        this.add.image(width/2, height/2, 'title')

        new Bubble(this, width / 2 - 150, height / 2 + 150, '  Click to Begin  ', 
            { fontSize: 40 }).setCallback(() => {
                this.scene.start('game')
            })
    }
}

class Game extends Phaser.Scene {

    centers // The centers of the ranking circles
    sprites // The sprites array
    moon // The moon sprite

    constructor() {
        super('game')
    }

    preload () {
        this.load.image('moon', 'assets/moon.png')
        cards.forEach(card => {
            this.load.image(card + '_front', 'assets/Lunar_Landing_Cards_R3_' + card + '.jpg')
            this.load.image(card, 'assets/Lunar_Landing_Cards_wDescription_R3_' + card + '.jpg')
        })
    }

    create () {
        let { width, height } = this.sys.game.canvas

        this.moon = this.add.sprite(width - 200, height - 120,'moon')
        
        let x = 50, y = 150
        let index = 1
        this.centers = []
        this.sprites = []
        cards.forEach(card => {
            let image = this.add.sprite(0, y, card + '_front').setInteractive({
                useHandCursor: true, pixelPerfect: true, draggable: true })
            
            // Position it relative to the previous x position
            x += image.displayWidth/2
            image.x = x
            // Hide card for now
            image.setVisible(false)
            this.sprites.push(image)
            this.centers.push([x, y])

            this.drawPlaceHolder(index, x, y)

            image.on('pointerover',function(pointer){
                image.tint = 0.5 * 0xffffff
            })
            image.on('pointerout',function(pointer){
                image.tint = 0xffffff
            })
            image.on('pointerdown',function(pointer){
                if (selected && selected!=image) {
                    selected.tint = 0xffffff
                }
                selected = image
                selected.tint = 0.5 * 0xffffff
                this.children.bringToTop(selected)
                isMoving = false
                isBackgroundClick = false
                selected.setTexture(card)
            }, this)
            image.on('pointerup',function(pointer){
                isBackgroundClick = false
            }, this)

            x += image.displayWidth/2 + 30
            if (x >= width - 200) {
                y += 200
                x = 50
            }

            // bring the cards up in 3 seconds
            let timer = this.time.delayedCall(1000 + index * 300, 
                function(image) {
                    image.setVisible(true)
                    this.children.bringToTop(image)
                },
                [image], this)  // delay in ms        
            
            index += 1
        })

        //  The pointer has to move 16 pixels before it's considered as a drag
        this.input.dragDistanceThreshold = 16

        this.input.on('dragstart', function (pointer, gameObject) {
            if (gameObject != rotator) {
                isMoving = true
            }
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX
            gameObject.y = dragY
        })

        this.input.on('dragend', function (pointer, gameObject) {
        })

        this.input.on('pointerdown', function(pointer){
            isBackgroundClick = true
        })
        this.input.on('pointerup', function(pointer){
            if (isBackgroundClick) {
                if (selected) {
                    selected.tint = 0xffffff
                    selected = null
                }
            }
        })

        isMoving = false
        isBackgroundClick = false

        this.moon.setInteractive().on('pointerdown', () => this.doTally())
        console.log(this.centers)
    }

    drawPlaceHolder(index, x, y) {
        let graphics = this.add.graphics()
        graphics.fillStyle(Phaser.Display.Color.ValueToColor(colors.white).color, 1)
        graphics.lineStyle(4, Phaser.Display.Color.ValueToColor(colors.gray).color, 10)
        graphics.strokeCircle(x, y, 50)
        let textSettings = {
            color : colors.gray,
            fontSize : 50,
            fontFamily : 'Helvetica Neue'
        }
        let text = this.add.text(x, y, index.toString(), textSettings)
        let bounds = text.getBounds()
        text.x = x - text.width / 2
        text.y = y - text.height / 2
    }

    doTally() {
        let rankings = {}
        console.log('Moon clicked')
        this.sprites.forEach(sprite => {
            let key = sprite.texture.key
            if (key.endsWith('_front')) {
                key = key.replace('_front','')
            }
            console.log(key, sprite.x, sprite.y)

            let index = -1
            let minDist = 99999
            for (let i=0; i<this.centers.length; i++) {
                let dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.centers[i][0], this.centers[i][1])
                if (dist < minDist && dist < 150) {
                    minDist = dist
                    index = i
                } 
            }

            if (index > -1) {
                rankings[key] = index
            } else {
                showCardsPlacingError()
                return
            }
        })
        console.log(rankings)
    }

    showCardsPlacingError() {
        // Show 3 second message
        let bubble = new Bubble(this, 400, 400, ' Cards not placed properly! ')
        let timer = this.time.delayedCall(3000, 
            function(bubble) {
                bubble.destroy()
            }, [bubble], this)  // delay in ms
    }
}

let config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: 1400,
        height: 900
    },
    backgroundColor: '#FFFFFF',
    scene: [Game]
}

let game = new Phaser.Game(config)
