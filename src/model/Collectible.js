const db = require('../config/db');

const Collectible = {
    all() {
        return db.prepare('SELECT * FROM collectibles ORDER BY unlock_after ASC').all();
    },

    unlockedIdsForUser(userId) {
        return new Set(
            db
                .prepare('SELECT collectible_id FROM user_collectibles WHERE user_id = ?')
                .all(userId)
                .map((r) => r.collectible_id)
        );
    },

    eligibleForCount(totalCompleted) {
        return db.prepare('SELECT * FROM collectibles WHERE unlock_after <= ?').all(totalCompleted);
    },

    unlockForUser(userId, collectibleId) {
        db.prepare('INSERT INTO user_collectibles (user_id, collectible_id) VALUES (?, ?)').run(
            userId,
            collectibleId
        );
    },

    collectionForUser(userId) {
        return db
            .prepare(
                `SELECT c.name, c.emoji, c.tier, uc.unlocked_at AS unlockedAt
         FROM user_collectibles uc
         JOIN collectibles c ON c.id = uc.collectible_id
         WHERE uc.user_id = ?
         ORDER BY uc.unlocked_at DESC`
            )
            .all(userId);
    },
};

module.exports = Collectible;