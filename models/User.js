// Simple in-memory User model for demonstration
// In production, use a real database (MongoDB, MySQL, PostgreSQL, etc.)

let users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123' // In production, always hash passwords!
  }
];

let nextId = 2;

class User {
  // Find user by email
  static findByEmail(email) {
    return users.find(user => user.email === email);
  }

  // Find user by id
  static findById(id) {
    return users.find(user => user.id === id);
  }

  // Get all users
  static getAll() {
    return users.map(({ password, ...user }) => user); // Don't expose passwords
  }

  // Create new user
  static create({ name, email, password }) {
    const newUser = {
      id: nextId++,
      name,
      email,
      password // In production, hash this with bcrypt!
    };
    users.push(newUser);
    return newUser;
  }

  // Authenticate user
  static authenticate(email, password) {
    const user = this.findByEmail(email);
    if (user && user.password === password) {
      // In production, use bcrypt.compare()
      return user;
    }
    return null;
  }

  // Update user
  static update(id, updates) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      return users[index];
    }
    return null;
  }

  // Delete user
  static delete(id) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = User;
