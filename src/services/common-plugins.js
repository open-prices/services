var colors = require('colors')

export function readyBanner(options = {}) {

    this.ready(() => {

        var char = '#'
        var message = char + ' ' + this.id + ' ' + char
        var separator_line = (function (message, char) {
            return message.split('').map(c => {
                return char
            }).join('')
        })(message, char);
        var title_line = (function (sep, message) {
            message = ' ' + message + ' '
            var offset = 1
            return sep.split('').map((c, i) => {
                if (i < offset) return c
                if (i == offset) return message.yellow.bold
                if (offset < i && i < (offset + message.length)) return ''
                return c

            }).join('')
        })(separator_line, 'Service ready'.toUpperCase());

        console.log(' ')
        console.log(title_line)
        console.log(message)
        console.log(separator_line)
        console.log(' ')
    })

}

export function patterns2pins(patterns) {
    return Object.keys(patterns).map(pattern => {
        return {
            pin: patterns[pattern]
        }
    })
}