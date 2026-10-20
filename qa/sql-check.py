"""Check numerical SQL examples against a temporary in-memory SQLite database."""
import sqlite3

db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE Student(sID INTEGER, sName TEXT, GPA REAL, sizeHS INTEGER);
INSERT INTO Student VALUES (1,'Amy',3.9,1000),(2,'Bob',3.6,1500),(3,'Amy',3.5,500);
CREATE TABLE Apply(sID INTEGER, cName TEXT, major TEXT, decision TEXT);
INSERT INTO Apply VALUES (1,'A','CS','Y'),(1,'B','CS','N'),(2,'B','EE','N');
CREATE TABLE A(id INTEGER);
CREATE TABLE B(id INTEGER);
INSERT INTO A VALUES(1),(2);
INSERT INTO B VALUES(2),(3);
''')

def scalar(sql):
    return db.execute(sql).fetchone()[0]

assert scalar('SELECT COUNT(*) FROM Student WHERE GPA BETWEEN 3.6 AND 3.9') == 2
assert scalar('SELECT COUNT(*) FROM A JOIN B ON A.id=B.id') == 1
assert scalar('SELECT COUNT(*) FROM A LEFT JOIN B ON A.id=B.id') == 2
assert scalar('SELECT COUNT(*) FROM A LEFT JOIN B ON A.id=B.id WHERE B.id>0') == 1
assert scalar('SELECT COUNT(*) FROM (SELECT 1 UNION ALL SELECT 1)') == 2
assert scalar('SELECT COUNT(*) FROM (SELECT 1 UNION SELECT 1)') == 1
assert scalar('SELECT COUNT(*) FROM Student S WHERE NOT EXISTS (SELECT 1 FROM Apply A WHERE A.sID=S.sID)') == 1
assert db.execute('SELECT S.sID,COUNT(A.sID),COUNT(*) FROM Student S LEFT JOIN Apply A ON S.sID=A.sID GROUP BY S.sID ORDER BY S.sID').fetchall() == [(1,2,2),(2,1,1),(3,0,1)]
assert scalar('SELECT COUNT(*) FROM (SELECT DISTINCT sName FROM Student)') == 2
assert scalar('SELECT EXISTS(SELECT NULL)') == 1
assert scalar('SELECT 3 NOT IN (1,NULL)') is None
assert scalar('SELECT COALESCE(NULL,0,7)') == 0
assert scalar('SELECT 1 OR NULL') == 1
assert scalar('SELECT 0 AND NULL') == 0
assert scalar('SELECT NOT NULL') is None
db.executescript('CREATE TABLE T(x); INSERT INTO T VALUES(10),(20),(NULL);')
assert scalar('SELECT AVG(x) FROM T') == 15
db.executescript('DELETE FROM T; INSERT INTO T VALUES(1),(1),(2),(NULL);')
assert scalar('SELECT COUNT(DISTINCT x) FROM T') == 2
assert scalar('SELECT COUNT(*) FROM (SELECT DISTINCT x FROM T)') == 3
db.execute('DELETE FROM T')
assert db.execute('SELECT COUNT(*),SUM(x),AVG(x),MIN(x),MAX(x) FROM T').fetchone() == (0,None,None,None,None)
db.executescript('INSERT INTO T VALUES(NULL),(NULL),(1);')
assert scalar('SELECT COUNT(*) FROM (SELECT DISTINCT x FROM T)') == 2
print('PASS: SQL counting, NULL, outer joins, DISTINCT, set operations, subqueries and empty aggregates.')
