
const cards =  ['Constellation_Map', 'Dehydrated_Milk',
                'First_Aid_Kit', 'Food_Concentrate',
                'Life_Raft', 'Magnetic_Compass',
                'Matches', 'Nylon_Rope',
                'Oxygen', 'Parachute_Silk',
                'Portable_Heating_Unit', 'Signal_Flare',
                'Two-Way_Radio', 'Water']

const nasaRankings = {
    'Oxygen' : 0,
    'Water' : 1,
    'Constellation_Map' : 2,
    'Food_Concentrate' : 3,
    'Two-Way_Radio' : 4,
    'Nylon_Rope' : 5,
    'First_Aid_Kit' : 6,
    'Parachute_Silk' : 7,
    'Life_Raft' : 8,
    'Signal_Flare' : 9,
    'Dehydrated_Milk' : 10,
    'Portable_Heating_Unit' : 11,
    'Magnetic_Compass' : 12,
    'Matches' : 13
}

var selected // The currently selected piece

var isMoving // Set to true when a piece is moved
var isBackgroundClick // Set to true when user clicks on the clear background

var isPopup // Set to true when there is a pop-up
var popup // The current popup
var popupX, popupY // the current popup original location
var inTransit // Set to true when the popup tween is playing

class Title extends Phaser.Scene {
    constructor() {
        super('title')
    }

    preload () {
        this.load.image('title', 'assets/title.png')
    }

    create() {
        let { width, height } = this.sys.game.canvas
        this.add.image(width/2, height/2, 'title')

        new Bubble(this, width / 2 - 150, height / 2 + 200, '  Click to Begin  ', 
            { fontSize: 40 }).setCallback(() => {
                this.scene.start('game')
            })
    }
}

class Game extends Phaser.Scene {

    centers // The centers of the ranking circles
    sprites // The sprites array
    moon // The moon sprite

    tallyContainer // Container for all Tally card related display objects

    constructor() {
        super('game')
    }

    preload () {
        this.load.image('moon', 'assets/moon.png')
        this.load.image('rank_table', 'assets/rank_table.png')
        cards.forEach(card => {
            this.load.image(card + '_front', 'assets/Lunar_Landing_Cards_R3_' + card + '.jpg')
            this.load.image(card, 'assets/Lunar_Landing_Cards_wDescription_R3_' + card + '.jpg')
        })
    }

    create () {
        let { width, height } = this.sys.game.canvas

        this.moon = this.add.sprite(width - 200, height - 120,'moon')
        
        let textSettings = {
            color : colors.gray,
            fontSize : 45,
            fontFamily : 'Helvetica Neue'
        }
        this.add.text(50, 0, 'Move the cards around to place them in the order of importance', textSettings)
        
        let x = 50, y = 170
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

            this.drawPlaceHolder(index, x, y, image.width, image.height)

            image.on('pointerover',function(pointer){
                if (isPopup) {
                    if (image != popup) {
                        image.tint = 0.5 * 0xffffff
                    }
                } else {
                    image.tint = 0.5 * 0xffffff
                }
            })
            image.on('pointerout', function(pointer) {
                image.tint = 0xffffff
            })

            image.on('pointerdown', function(pointer, localX, localY, event) {
                if (!inTransit && popup != image) {
                    if (selected && selected!=image) {
                        selected.tint = 0xffffff
                    }
                    selected = image
                    selected.tint = 0.5 * 0xffffff
                    this.children.bringToTop(selected)
                }
                isMoving = false
                isBackgroundClick = false
            }, this)

            image.on('pointerup', function(pointer, localX, localY, event) {
                isBackgroundClick = false
                if (!isMoving && popup != image && !inTransit) {
                    image.tint = 0xffffff
                    inTransit = true
                    popupX = image.x
                    popupY = image.y
                    isPopup = true
                    popup = image
                    let tween = this.tweens.add({
                        targets: image,
                        x: width/2,
                        y: height/2,
                        scale: 2.5,
                        duration: 1000,
                        ease: 'Elastic',
                        easeParams: [ 3, 3 ]
                    })
                    tween.on('complete', function(tween, targets) {
                        inTransit = false
                    }, this);
                    image.setTexture(card)
                }
                event.stopPropagation()
            }, this)

            x += image.displayWidth/2 + 30
            if (x >= width - 200) {
                y += 205
                x = 50
            }

            // bring the cards up in 3 seconds
            let timer = this.time.delayedCall(10, // 1000 + index * 150,
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
            isMoving = true
        }, this)

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX
            gameObject.y = dragY
        }, this)

        this.input.on('dragend', function (pointer, gameObject) {
        }, this)

        this.input.on('pointerdown', function(pointer) {
            isBackgroundClick = true
            if (isPopup && !inTransit) {
                this.hidePopup()
            }
        }, this)

        this.input.on('pointerup', function(pointer){
            if (isBackgroundClick) {
                if (selected) {
                    selected.tint = 0xffffff
                    selected = null
                }
            }
        }, this)

        isMoving = false
        isBackgroundClick = false

        this.moon.setInteractive().on('pointerdown', () => this.doTally())
    }

    hidePopup() {
        inTransit = true
        let tween = this.tweens.add({
            targets: popup,
            x: popupX,
            y: popupY,
            scale: 1,
            duration: 700,
            ease: 'Cubic',
            easeParams: [ 3, 3 ]
        })

        let key = popup.texture.key
        if (!key.endsWith('_front')) {
            key = key + '_front'
        }
        popup.setTexture(key)
        tween.on('complete', function(tween, targets){
            inTransit = false
        }, this)
        isPopup = false
        popup = null
    }

    drawPlaceHolder(index, x, y, width, height) {
        let pad = 10
        let graphics = this.add.graphics()
        graphics.fillStyle(Phaser.Display.Color.ValueToColor(colors.white).color, 1)
        graphics.lineStyle(4, Phaser.Display.Color.ValueToColor(colors.gray).color, 10)
        graphics.strokeRoundedRect(x - width/2 + pad, y - height/2 + pad, width - pad*2, height - pad*2, 16)
        let textSettings = {
            color : colors.gray,
            fontSize : 30,
            fontFamily : 'Helvetica Neue'
        }
        let text = this.add.text(x, y, index.toString(), textSettings)
        let bounds = text.getBounds()
        text.x = x - text.width / 2
        text.y = y - height/2 - text.height + 5
    }

    doTally() {
        if (this.tallyContainer && this.tallyContainer.visible) {
            // Tally Container is visible, return
            return
        }

        let usedIndex = new Map()
        let userRank = new Map()
        let tally = 0
        let errors = false

        this.sprites.forEach(sprite => {
            let key = sprite.texture.key
            if (key.endsWith('_front')) {
                key = key.replace('_front','')
            }

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
                if (usedIndex.has(index)) {
                    // two cards are overlapping each other too closely
                    errors = true
                } else {
                    usedIndex.set(index, key)
                    userRank.set(key, index)
                }
            } else {
                errors = true
            }

            tally += Math.abs(index - nasaRankings[key])
        })

        if (errors) {
            this.showCardsPlacingError()
        } else {
            let text = ''
            if (tally <= 25) {
                text = 'Excellent - You and your crew demonstrated great survival skills!'
            } else if (tally <= 32) {
                text = 'Great - Above average skills. You made it!'
            } else if (tally <= 45) {
                text = 'Good - It was a struggle, but you made it back to base.'
            } else if (tally <= 55) {
                text = 'Average - At least you’re still alive, but you barely survived!'
            } else if (tally <= 70) {
                text = 'Poor - Sadly, not everyone made it back to base.'
            } else {
                text = 'Tragic - Oh dear, your bodies lie lifeless on the surface of the moon!'
            }
    
            const scale = 1
            const { width, height } = this.sys.game.canvas

            let tallyCard = this.add.image(0, 0, 'rank_table').setOrigin(0,0).setScale(scale)
            this.tallyContainer = this.add.container(width/2 - tallyCard.displayWidth/2, height/2 - tallyCard.displayHeight/2)
            this.tallyContainer.add(tallyCard)

            const border = this.add.rectangle(0, 0, tallyCard.displayWidth, tallyCard.displayHeight).setOrigin(0, 0)
            border.setStrokeStyle(2, Phaser.Display.Color.ValueToColor(colors.black).color)
            this.tallyContainer.add(border)
    
            const xLeft = 720 // Center of the left column
            const xRight = 860 // Center of the right column
            const yTop = 185 // Center of the topmost row
            const yStep = 35 // Gap between row centers
    
            const textSettings = { fontFamily: 'Helvetica Neue', fontSize: 20, color: colors.black, align: 'center' }
    
            const originX = width/2 - tallyCard.displayWidth/2
            const originY = height/2 - tallyCard.displayHeight/2
    
            let total = 0
            for (const key in nasaRankings) {
                const y = yTop + yStep * nasaRankings[key]
                
                const rankStr = (userRank.get(key) + 1).toString() // Add 1 because our internal representation starts at 0
                const rankText = this.add.text(xLeft * scale, y * scale, rankStr, textSettings).setOrigin(0.5, 0.6)
                this.tallyContainer.add(rankText)
            
                const score = Math.abs(nasaRankings[key] - userRank.get(key))
                const scoreStr = score.toString()
                const scoreText = this.add.text(xRight * scale, y * scale, scoreStr, textSettings).setOrigin(0.5, 0.6)
                this.tallyContainer.add(scoreText)
                
                total += score
            }
            const totalStr = total.toString()
            const totalText = this.add.text(xRight * scale, (yTop + yStep * 14) * scale, totalStr, textSettings).setOrigin(0.5, 0.6)
            this.tallyContainer.add(totalText)
    
            let bubble = new Bubble(this, 170, 400, text)
            bubble.x = tallyCard.displayWidth/2 - bubble.shape.width/2
            bubble.y = tallyCard.displayHeight - 100
            this.tallyContainer.add(bubble)

            bubble.setCallback(() => {
                this.tallyContainer.destroy()
            })
        }
    }

    showCardsPlacingError() {
        // Show 3 second message
        let bubble = new Bubble(this, 500, 400, ' Cards not placed properly! ')
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
