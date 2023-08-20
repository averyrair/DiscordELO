const {db} = require('../db')

module.exports = {
    getRatings,
    getRating,
    setRating,
    setRatings,
    resetRatings,
    getServerRatings
}

async function getServerRatings(server) {
    return await new Promise((resolve, reject) => {
        db.query(`
            SELECT * FROM players WHERE server_id = ${db.escape(server)}
        `,
        (err, results) => {
            return err ? reject(err) : resolve(results)
        })
    })
}

async function resetRatings(server) {
    await new Promise((resolve, reject) => {
        db.query(`
            DELETE FROM players WHERE server_id = ${db.escape(server)}
        `,
        (err, results) => {
            return err ? reject(err) : resolve(results)
        })
    })
}

async function getRatings(members) {
    let ratings = []
    for (member of members) {
        ratings.push(await getRating(member))
        
    }
    return ratings
}

async function getRating(member) {

    return new Promise((resolve, reject) => {
        db.query(`
            INSERT INTO players (user_id, server_id, rating)
                SELECT
                    ${db.escape(member.id)},
                    ${db.escape(member.guild.id)},
                    1000
                WHERE NOT EXISTS
                    (SELECT * FROM players WHERE user_id = ${db.escape(member.id)} AND server_id = ${db.escape(member.guild.id)})
                LIMIT 1;
            SELECT rating FROM players WHERE user_id = ${db.escape(member.id)} AND server_id = ${db.escape(member.guild.id)};
        `,
        (err, results) => {
            return err ? reject(err) : resolve(results[1][0].rating)
        })
    })
}

async function setRating(member, rating) {
    return new Promise((resolve, reject) => {
        db.query(`
            INSERT INTO players (user_id, server_id, rating)
                SELECT
                    ${db.escape(member.id)},
                    ${db.escape(member.guild.id)},
                    1000
                WHERE NOT EXISTS
                    (SELECT * FROM players WHERE user_id = ${db.escape(member.id)} AND server_id = ${db.escape(member.guild.id)})
                LIMIT 1;
            UPDATE players
                SET rating = ${db.escape(rating)}
                WHERE user_id = ${db.escape(member.id)} AND server_id = ${db.escape(member.guild.id)};
            SELECT rating FROM players WHERE user_id = ${db.escape(member.user.id)} AND server_id = ${db.escape(member.guild.id)};
        `,
        (err, results) => {
            return err ? reject(err) : resolve(results[0].rating)
        })
    })
}

async function setRatings(members, ratings) {
    for (let i = 0; i < members.length; i++) {
        await setRating(members[i], ratings[i])
    }
}