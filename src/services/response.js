export default function Response(data, options){
    return Object.assign({
        service : this.id
    }, options, { data })
}