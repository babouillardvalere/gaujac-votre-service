// Système de logging centralisé pour le mode QA
class ErrorLogger {
  constructor() {
    this.logs = this.loadLogs();
    this.setupGlobalHandlers();
  }

  loadLogs() {
    try {
      const stored = localStorage.getItem('qa_error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem('qa_error_logs', JSON.stringify(this.logs.slice(-500))); // Garde max 500 logs
    } catch (e) {
      console.error('Impossible de sauvegarder les logs:', e);
    }
  }

  log(type, category, message, details = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type, // 'error', 'warning', 'api', 'data', 'ui', 'success'
      category, // 'intervention', 'navigation', 'auth', etc.
      message,
      details,
      user: this.getCurrentUser(),
      url: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100)
    };

    this.logs.push(entry);
    this.saveLogs();

    // Log aussi en console en dev
    if (type === 'error') {
      console.error(`[QA Logger] ${category}:`, message, details);
    }

    return entry;
  }

  getCurrentUser() {
    try {
      const user = sessionStorage.getItem('arrivee_nom') || 'Anonyme';
      return user;
    } catch {
      return 'Unknown';
    }
  }

  setupGlobalHandlers() {
    // Capture erreurs JavaScript
    window.addEventListener('error', (event) => {
      this.log('error', 'runtime', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'promise', event.reason?.message || 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  // Log erreur API
  logAPIError(endpoint, method, payload, error) {
    return this.log('api', 'api_error', `API Error: ${method} ${endpoint}`, {
      endpoint,
      method,
      payload,
      error: error.message || error,
      status: error.status
    });
  }

  // Log erreur de données
  logDataError(entity, operation, issue, details) {
    return this.log('data', 'data_integrity', `Data Error: ${entity} - ${operation}`, {
      entity,
      operation,
      issue,
      ...details
    });
  }

  // Log action utilisateur
  logUserAction(action, details) {
    return this.log('success', 'user_action', action, details);
  }

  // Récupération des logs filtrés
  getLogs(filter = {}) {
    let filtered = [...this.logs];

    if (filter.type) {
      filtered = filtered.filter(log => log.type === filter.type);
    }

    if (filter.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filter.endDate));
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Export rapport
  exportReport() {
    const report = {
      generated_at: new Date().toISOString(),
      total_logs: this.logs.length,
      errors: this.logs.filter(l => l.type === 'error').length,
      warnings: this.logs.filter(l => l.type === 'warning').length,
      api_errors: this.logs.filter(l => l.category === 'api_error').length,
      data_errors: this.logs.filter(l => l.category === 'data_integrity').length,
      logs: this.logs
    };

    return JSON.stringify(report, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }
}

// Instance singleton
const errorLogger = new ErrorLogger();

export default errorLogger;