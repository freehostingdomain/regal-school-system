const { getDb } = require('../database');

function logActivity(user, action, entityType, entityId, entityName, details, ipAddress) {
  try {
    const db = getDb();
    
    db.prepare(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action, entity_type, entity_id, entity_name, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.name,
      user.role,
      action,
      entityType,
      entityId || null,
      entityName || '',
      details || '',
      ipAddress || ''
    );

    if (user.role !== 'super_admin') {
      const superAdmins = db.prepare("SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1").all();
      for (const admin of superAdmins) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, 'activity')
        `).run(
          admin.id,
          `${action} ${entityType}`,
          `${user.name} (${user.role}) ${action} ${entityType}: "${entityName}"${details ? ' - ' + details : ''}`
        );
      }
    }
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
}

function activityLogger(entityType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        let action = 'viewed';
        let entityId = null;
        let entityName = '';
        let details = '';

        if (req.method === 'POST') {
          action = 'created';
          if (data?.data?.id) entityId = data.data.id;
          if (data?.data?.student_id) entityName = data.data.student_id;
          if (data?.data?.first_name) entityName = `${data.data.first_name} ${data.data.last_name}`;
          if (data?.data?.name) entityName = data.data.name;
          if (data?.data?.title) entityName = data.data.title;
          if (data?.data?.voucher_number) entityName = data.data.voucher_number;
          if (data?.data?.receipt_number) entityName = data.data.receipt_number;
          if (req.body?.records) {
            action = 'marked attendance';
            entityName = `${req.body.records.length} students`;
            details = `Date: ${req.body.date || new Date().toISOString().split('T')[0]}`;
          }
        } else if (req.method === 'PUT') {
          action = 'updated';
          entityId = req.params?.id;
          entityName = req.body?.first_name ? `${req.body.first_name} ${req.body.last_name || ''}` : (req.body?.name || req.body?.title || `ID: ${entityId}`);
          const changes = Object.keys(req.body).filter(k => k !== 'password').join(', ');
          details = `Changed: ${changes}`;
        } else if (req.method === 'DELETE') {
          action = 'deleted';
          entityId = req.params?.id;
          entityName = req.body?.name || `ID: ${entityId}`;
        }

        if (action !== 'viewed') {
          logActivity(
            req.user,
            action,
            entityType,
            entityId,
            entityName,
            details,
            req.ip
          );
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = { logActivity, activityLogger };
