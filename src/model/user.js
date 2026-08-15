const db = require('../config/db');

const User = {
    findByEmail(email) {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },

    findById(id) {
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    },

    create({ name, email, passwordHash }) {
        const result = db
            .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
            .run(name, email, passwordHash);
        return this.findById(result.lastInsertRowid);
    },

    updateAfterCompletion(userId, { pointsEarned, newStreak, newBest, todayStr }) {
        db.prepare(
            `UPDATE users
       SET points = points + ?, current_streak = ?, best_streak = ?, last_completed_day = ?
       WHERE id = ?`
        ).run(pointsEarned, newStreak, newBest, todayStr, userId);
    },

    resetStreak(userId) {
        db.prepare('UPDATE users SET current_streak = 0 WHERE id = ?').run(userId);
    },

    setDailyGoal(userId, dailyGoal) {
        db.prepare('UPDATE users SET daily_goal = ? WHERE id = ?').run(dailyGoal, userId);
    },
};

module.exports = User;