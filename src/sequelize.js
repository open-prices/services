import { connection } from 'database-models'

var sequelize = connection({
    logging : null
})

export default sequelize
