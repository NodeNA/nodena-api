import { scheduleJob } from 'node-schedule'

export default app => {
    scheduleJob('*/1 * * * *', async function () {
        const usersCount = await app.db('users').count('id').first()
        const eventsCount = await app.db('events').count('id').first()
        const postsCount = await app.db('posts').count('id').first()

        const { Stat } = app.api.stat

        const lastStat = await Stat.findOne({}, {},
            { sort: { 'createdAt' : -1 } })

        const stat = new Stat({
            users: usersCount.count,
            events: eventsCount.count,
            posts: postsCount.count,
            createdAt: new Date()
        })

        const changeUsers = !lastStat || stat.users !== lastStat.users
        const changeEvents = !lastStat || stat.events !== lastStat.events
        const changePosts = !lastStat || stat.posts !== lastStat.posts

        if(changeUsers || changeEvents || changePosts) {
            stat.save().then(() => console.log('[Stats] Estatíticas atualizadas!'))
        }
    })
}