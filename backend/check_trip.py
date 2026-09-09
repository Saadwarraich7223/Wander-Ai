import sqlite3

conn = sqlite3.connect('dev.db')
cur = conn.cursor()

cur.execute("SELECT c.name, COUNT(p.id) as cnt FROM places p JOIN cities c ON p.city_id = c.id GROUP BY c.name ORDER BY cnt DESC")
print("=== PLACES PER CITY ===")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]} places")

print()
cur.execute("SELECT p.name, p.latitude, p.longitude, p.popularity_score FROM places p JOIN cities c ON p.city_id = c.id WHERE c.slug = 'hunza' ORDER BY p.popularity_score DESC")
print("=== HUNZA PLACES ===")
for row in cur.fetchall():
    print(f"  {row[0]} | lat={row[1]}, lng={row[2]} | popularity={row[3]}")

conn.close()
