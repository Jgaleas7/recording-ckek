INSERT INTO capturers (id, name, is_active, is_automatic, record_active_id)
VALUES
  (3, 'capturer3', FALSE, FALSE, NULL),
  (4, 'capturer4', FALSE, FALSE, NULL)
ON CONFLICT (name) DO NOTHING;
