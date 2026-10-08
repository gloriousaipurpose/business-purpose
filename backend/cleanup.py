import sqlite3

conn = sqlite3.connect("radar.db")
cur = conn.cursor()
cur.execute("UPDATE runs SET status = 'failed', finished_at = CURRENT_TIMESTAMP WHERE status = 'running'")
conn.commit()
print("Successfully cleaned up all stuck runs in radar.db.")
conn.close()
