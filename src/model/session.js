const db = require('../config/db');

const Session = {
    findActiveByUser(userId) {
        return db
            .prepare("SELECT * FROM sessions WHERE user_id = ? AND status = 'active'")
            .get(userId);
    },

    findByIdAndUser(id, userId) {
        return db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(id, userId);
    },

    create({ userId, durationMin, intention }) {
        const result = db
            .prepare('INSERT INTO sessions (user_id, duration_min, intention, status) VALUES (?, ?, ?, ?)')
            .run(userId, durationMin, intention || null, 'active');
        return db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
    },

    markCompleted(sessionId, { completedAt, pointsEarned }) {
        db.prepare(
            "UPDATE sessions SET status = 'completed', completed_at = ?, points_earned = ? WHERE id = ?"
        ).run(completedAt, pointsEarned, sessionId);
    },

    markAbandoned(sessionId, abandonedAt) {
        db.prepare(
            "UPDATE sessions SET status = 'abandoned', completed_at = ? WHERE id = ?"
        ).run(abandonedAt, sessionId);
        return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    },

    countCompletedByUser(userId) {
        return db
            .prepare("SELECT COUNT(*) AS c FROM sessions WHERE user_id = ? AND status = 'completed'")
            .get(userId).c;
    },

    countCompletedToday(userId, todayStr) {
        return db
            .prepare(
                `SELECT COUNT(*) AS c FROM sessions
         WHERE user_id = ? AND status = 'completed' AND date(completed_at) = ?`
            )
            .get(userId, todayStr).c;
    },

    totalsByUser(userId) {
        return db
            .prepare(
                `SELECT COUNT(*) AS totalSessions, COALESCE(SUM(duration_min), 0) AS totalQuietMinutes
         FROM sessions WHERE user_id = ? AND status = 'completed'`
            )
            .get(userId);
    },

    historyByDay(userId, days) {
        return db
            .prepare(
                `SELECT date(completed_at) AS date, COUNT(*) AS sessionsCount, SUM(duration_min) AS minutes
         FROM sessions
         WHERE user_id = ? AND status = 'completed' AND date(completed_at) >= date('now', ?)
         GROUP BY date(completed_at)
         ORDER BY date ASC`
            )
            .all(userId, `-${days} days`);
    },

    recentByUser(userId, limit, offset) {
        return db
            .prepare(
                `SELECT date(started_at) AS date, duration_min AS durationMin, intention, status, points_earned AS pointsEarned
         FROM sessions WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`
            )
            .all(userId, limit, offset);
    },
};

module.exports = Session;