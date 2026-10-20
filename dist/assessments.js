(() => {
  'use strict';
  const source = 'https://courses.uit.edu.vn/mod/quiz/view.php?id=23147';
  const pages = [1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,15,15,16,16,17,17,18,18,19,19,20,20,21,21];
  const questions = [];
  function add(number, topic, prompt, options, answer, explanation, code='', note='', reference='') {
    questions.push({id:`kt2-${String(number).padStart(2,'0')}`, topic, prompt, options, answer, explanation, code, note, reference, source, sourceNumber:number, sourcePage:pages[number-1], assessment:'kiem-tra-2'});
  }
  add(1,'joins','Amy nộp ngành CS ở 2 trường khác nhau. Trong kết quả truy vấn sau, tên Amy xuất hiện mấy lần?',[
    '1 lần, vì SQL tự loại dòng trùng như đại số quan hệ',
    'Không lần nào, vì truy vấn báo lỗi tên cột sID mơ hồ',
    '1 lần, vì Amy chỉ có đúng một dòng trong bảng STUDENT',
    '2 lần, vì SQL mặc định giữ lại các dòng trùng nhau',
  ],3,'Mỗi đơn CS khớp tạo một hàng kết quả. Hai đơn ở hai trường tạo hai hàng mang tên Amy; SELECT không có DISTINCT nên không gộp chúng.',
  "SELECT sName FROM STUDENT, APPLY\nWHERE STUDENT.sID = APPLY.sID AND major = 'CS';");
  add(2,'joins','Phát biểu nào đúng về phép OUTER JOIN khi nối nhiều bảng?',[
    'Có cả tính kết hợp lẫn giao hoán giống như inner join',
    'Có tính kết hợp nhưng không có tính giao hoán',
    'Thứ tự các bảng chỉ ảnh hưởng hiệu năng, không đổi kết quả',
    'Không có tính kết hợp; thứ tự và dấu ngoặc có thể đổi kết quả',
  ],3,'Không thể đổi thứ tự hoặc nhóm các phép outer join một cách tùy ý như các phép inner join phù hợp. Các hàng bổ sung NULL có thể được tạo hoặc bị loại ở bước khác nhau, làm đổi kết quả.');
  add(3,'aggregation','Phát biểu nào đúng về WHERE và HAVING?',[
    'WHERE dùng được hàm nhóm, còn HAVING thì không dùng được',
    'WHERE lọc từng dòng trước khi nhóm; HAVING lọc nhóm sau đó',
    'WHERE và HAVING thay thế được cho nhau trong mọi truy vấn',
    'HAVING chỉ dùng được khi truy vấn không có mệnh đề WHERE',
  ],1,'WHERE xác định các hàng đầu vào trước GROUP BY. HAVING kiểm tra các nhóm sau khi tổng hợp, nên có thể dùng điều kiện như COUNT(*) >= 2.');
  add(4,'aggregation','Theo bài giảng, chạy truy vấn sau trên SQLite hoặc MySQL thì sao?',[
    'Chạy được; cName là một giá trị bất kỳ trong nhóm',
    'Báo lỗi vì cName không nằm trong mệnh đề GROUP BY',
    'Mỗi cặp (sID, cName) được tách thành một nhóm riêng',
    'Cột cName hiển thị danh sách mọi trường trong nhóm',
  ],0,'Đáp án trong PDF dùng hành vi cho phép cột không tổng hợp ngoài GROUP BY: một giá trị cName của nhóm được chọn, không phải danh sách tất cả các trường.',
  'SELECT sID, cName, COUNT(*)\nFROM APPLY GROUP BY sID;',
  'Ngữ cảnh bài giảng: SQLite hoặc MySQL ở chế độ cho phép cách viết này. MySQL 8.4 mặc định bật ONLY_FULL_GROUP_BY và thường từ chối truy vấn trên nếu không có phụ thuộc hàm phù hợp. Đáp án chấm vẫn giữ theo PDF.',
  'https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html');
  add(5,'joins','Theo bài giảng, hệ quản trị nào báo lỗi với cách viết join 3 bảng không lồng ngoặc sau?',[
    'PostgreSQL', 'MySQL', 'SQLite', 'SQLite và MySQL',
  ],0,'PostgreSQL yêu cầu cú pháp JOIN có điều kiện tương ứng rõ ràng; một ON sau chuỗi hai JOIN không thay cho điều kiện của cả hai phép kết. Cách rõ nghĩa là viết JOIN STUDENT ON ... rồi JOIN COLLEGE ON ... .',
  'SELECT *\nFROM APPLY JOIN STUDENT JOIN COLLEGE\nON APPLY.sID = STUDENT.sID\nAND APPLY.cName = COLLEGE.cName;');
  add(6,'updates','Thực hành tốt nào được minh họa trước khi chạy một lệnh UPDATE hoặc DELETE?',[
    'Thêm ORDER BY để lệnh tác động theo đúng thứ tự dòng',
    'Xóa trước các dòng liên quan trong bảng APPLY',
    'Chạy SELECT cùng điều kiện để xem các dòng bị tác động',
    'Chạy lệnh không có WHERE trước để kiểm tra cú pháp',
  ],2,'SELECT với cùng WHERE giúp kiểm tra đúng phạm vi dữ liệu dự định sửa hoặc xóa. Nó hỗ trợ kiểm chứng ý định nhưng không thay thế kiểm soát đồng thời khi dữ liệu có thể đổi.');
  add(7,'sets','Toán tử tập hợp nào của SQL biểu diễn trực tiếp phép hiệu của đại số quan hệ?',[
    'EXCEPT', 'UNION ALL', 'UNION', 'INTERSECT',
  ],0,'R EXCEPT S lấy các hàng có trong R nhưng không có trong S, tương ứng phép hiệu tập hợp R − S ở dạng loại trùng mặc định.');
  add(8,'subquery','Trong MySQL hoặc PostgreSQL, truy vấn sau cho kết quả gì nếu một trường có nhiều sinh viên nộp đơn?',[
    'Báo lỗi vì truy vấn con trả về nhiều hơn một dòng',
    'Tên các sinh viên được nối lại thành một chuỗi',
    'Mỗi trường được lặp lại theo từng tên sinh viên',
    'Chỉ lấy tên sinh viên được chèn vào bảng sớm nhất',
  ],0,'Một truy vấn con vô hướng ở SELECT phải trả không quá một hàng. Khi có nhiều hàng tên sinh viên, MySQL/PostgreSQL báo lỗi thay vì tự nối chuỗi hoặc tùy ý chọn một tên.',
  'SELECT cName,\n  (SELECT sName FROM APPLY JOIN STUDENT USING(sID)\n   WHERE APPLY.cName = COLLEGE.cName)\nFROM COLLEGE;');
  add(9,'joins','Trong truy vấn tìm cặp sinh viên cùng GPA sau, nếu chỉ thêm điều kiện S1.sID <> S2.sID thì kết quả còn vấn đề gì?',[
    'Kết quả vẫn còn các cặp sinh viên ghép với chính mình',
    'Mỗi cặp xuất hiện hai lần theo hai chiều ngược nhau',
    'Các cặp có hai sinh viên cùng tên bị loại khỏi kết quả',
    'Các sinh viên có GPA là NULL được ghép cặp với nhau',
  ],1,'Điều kiện khác sID loại ghép một người với chính họ nhưng giữ cả (A,B) và (B,A). Dùng S1.sID < S2.sID để chỉ giữ một chiều.',
  'SELECT S1.sName, S2.sName\nFROM STUDENT S1, STUDENT S2\nWHERE S1.GPA = S2.GPA;');
  add(10,'subquery','Truy vấn sau được viết để tìm các trường có trường khác cùng bang. Truy vấn này có vấn đề gì?',[
    'Mỗi trường lặp lại nhiều lần theo số trường cùng bang',
    'Báo lỗi vì truy vấn con không được tham chiếu đến C1',
    'Trả về mọi trường, vì C2 có thể chính là trường C1',
    'Không trả dòng nào vì EXISTS luôn sai khi tự tham chiếu',
  ],2,'Trong dữ liệu bài giảng có state đã biết, chính hàng C1 thỏa C2.state = C1.state nên EXISTS đúng. Cần thêm C2.cName <> C1.cName để yêu cầu một trường khác.',
  'SELECT cName, state FROM COLLEGE C1\nWHERE EXISTS (SELECT * FROM COLLEGE C2\n              WHERE C2.state = C1.state);',
  'Câu gốc giả định state không NULL như dữ liệu bài giảng. Nếu state là NULL, phép so sánh bằng với chính NULL không cho TRUE.');
  add(11,'subquery','Truy vấn sau được viết với ý định tìm sinh viên nộp CS nhưng không nộp EE. Thực tế truy vấn này trả về gì?',[
    'Sinh viên nộp CS và nộp thêm ít nhất một ngành khác CS',
    'Đúng các sinh viên nộp CS và chưa từng nộp ngành EE',
    'Mọi sinh viên có nộp CS, kể cả những người đã nộp EE',
    'Chỉ những sinh viên đã nộp cả hai ngành CS và EE',
  ],2,'Một đơn CS có thể đóng cả hai vai trò A1 và A2 vì CS khác EE. Vì vậy chỉ cần có đơn CS là đã tạo được cặp khớp, ngay cả khi người đó còn nộp EE. Muốn loại hẳn EE, dùng NOT EXISTS, NOT IN phù hợp hoặc EXCEPT.',
  "SELECT DISTINCT A1.sID FROM APPLY A1, APPLY A2\nWHERE A1.sID = A2.sID\n  AND A1.major = 'CS' AND A2.major <> 'EE';");
  add(12,'joins','Truy vấn sau sẽ cho kết quả như thế nào?',[
    'Báo lỗi vì không được so sánh cột của hai bảng khác nhau',
    'Báo lỗi vì không xác định được cName trong SELECT thuộc bảng nào',
    'Chạy được và tự động lấy cName từ bảng COLLEGE viết trước',
    'Chạy được vì hai cột cName đã được đặt bằng nhau trong WHERE',
  ],1,'Cả COLLEGE và APPLY có cName. Việc so sánh bằng trong WHERE không gộp tên hai cột, nên SELECT cName vẫn mơ hồ. Cần viết COLLEGE.cName hoặc APPLY.cName.',
  'SELECT cName, major FROM COLLEGE, APPLY\nWHERE COLLEGE.cName = APPLY.cName;');
  add(13,'joins','Truy vấn sau trả về những sinh viên nào?',[
    'Duy nhất một sinh viên có GPA cao nhất',
    'Mọi sinh viên, trừ những người có GPA cao nhất',
    'Mọi sinh viên, trừ những người có GPA thấp nhất',
    'Chỉ những sinh viên có GPA cao nhất',
  ],2,'Một sinh viên được giữ nếu tồn tại ít nhất một sinh viên khác có GPA thấp hơn. Người đạt GPA thấp nhất không có đối tác như vậy. DISTINCT loại các cặp giá trị đầu ra trùng nhau.',
  'SELECT DISTINCT S1.sName, S1.GPA\nFROM STUDENT S1, STUDENT S2\nWHERE S1.GPA > S2.GPA;',
  'Đáp án gốc xét GPA đã biết. Hàng GPA NULL cũng không được giữ; DISTINCT trên sName,GPA có thể gộp các sinh viên khác nhau cùng tên và GPA.');
  add(14,'joins','Truy vấn tìm các cặp sinh viên có cùng GPA cần thêm điều kiện nào để loại các cặp (Amy, Amy) và để mỗi cặp chỉ xuất hiện một lần?',[
    'AND S1.sID <> S2.sID', 'AND S1.sName <> S2.sName',
    'AND S1.GPA < S2.GPA', 'AND S1.sID < S2.sID',
  ],3,'So sánh thứ tự trên mã duy nhất loại cùng một sinh viên và chỉ giữ một trong hai hướng của mỗi cặp. Không dùng tên vì hai người khác nhau có thể trùng tên.',
  'SELECT S1.sName, S2.sName\nFROM STUDENT S1, STUDENT S2\nWHERE S1.GPA = S2.GPA;',
  '“Loại (Amy,Amy)” trong câu gốc nói đến ghép một người với chính họ. Hai người khác mã nhưng cùng tên vẫn có thể hiển thị một cặp tên giống nhau.');
  add(15,'basic','Về thứ tự các dòng trong kết quả truy vấn SQL, phát biểu nào đúng?',[
    'Thứ tự chỉ được đảm bảo khi truy vấn có mệnh đề ORDER BY',
    'Kết quả của phép UNION luôn được sắp xếp theo thứ tự tăng dần',
    'Kết quả giữ đúng thứ tự các dòng đã được chèn vào bảng',
    'Kết quả luôn được sắp theo khóa chính của bảng đầu tiên',
  ],0,'ORDER BY mới quy định thứ tự kết quả. Với các hàng bằng nhau trên mọi khóa sắp xếp đã nêu, thứ tự tương đối vẫn chưa được phân định nếu không có thêm khóa phân biệt.');
  add(16,'joins','Vì sao NATURAL JOIN được xem là cách viết tiềm ẩn rủi ro?',[
    'Nó chỉ dùng được khi hai bảng có đúng một cột chung với nhau',
    'Nó luôn trả về tích Descartes khi hai bảng có các cột trùng tên',
    'Nó giữ lại cả hai bản sao của các cột được dùng để so khớp',
    'Nó ngầm so khớp mọi cột trùng tên, kể cả cột được thêm vào sau này',
  ],3,'Các thuộc tính cùng tên tự trở thành điều kiện bằng của natural join. Thay đổi lược đồ có thể bổ sung điều kiện ngoài ý định và làm đổi kết quả.');
  add(17,'joins','Viết FROM STUDENT JOIN APPLY USING(sID) ON GPA > 3.7 sẽ bị lỗi. Cách sửa đúng là gì?',[
    'Giữ USING, chuyển điều kiện GPA > 3.7 sang mệnh đề WHERE',
    'Đổi USING thành NATURAL JOIN để giữ được mệnh đề ON',
    'Lặp lại USING hai lần, mỗi lần cho một điều kiện',
    'Đặt điều kiện GPA > 3.7 vào trong ngoặc của USING',
  ],0,'Một phép kết không dùng đồng thời USING và ON như trên. USING(sID) đã quy định cột kết; điều kiện lọc GPA có thể đặt trong WHERE đối với inner join.');
  add(18,'joins','Với inner join, đặt điều kiện lọc trong ON hay trong WHERE khác nhau thế nào?',[
    'Đặt trong ON cho kết quả ít dòng hơn đặt trong WHERE',
    'Kết quả như nhau, vị trí đặt chỉ là gợi ý cho bộ tối ưu',
    'Đặt trong WHERE luôn làm truy vấn chạy chậm hơn đáng kể',
    'Điều kiện không liên quan đến cột nối bắt buộc nằm trong ON',
  ],1,'Với các điều kiện lọc thông thường tương đương ở inner join, chuyển giữa ON và WHERE không đổi tập hàng kết quả. Không được suy rộng điều này sang outer join.', '',
  'Giữ nguyên cách diễn đạt của đáp án PDF. ON/WHERE không phải một chỉ thị optimizer-hint bắt buộc; kế hoạch do DBMS lựa chọn. Kết luận tương đương xét điều kiện thông thường, không có hiệu ứng phụ.');
  add(19,'basic','Với mệnh đề ORDER BY GPA DESC, sName các dòng được sắp xếp như thế nào?',[
    'GPA tăng dần; các dòng cùng GPA thì sName giảm dần',
    'GPA giảm dần; các dòng cùng GPA thì sName tăng dần',
    'Sắp theo sName trước, rồi mới sắp theo GPA giảm dần',
    'GPA giảm dần; các dòng cùng GPA thì sName giảm dần',
  ],1,'GPA là khóa sắp xếp ưu tiên với hướng DESC. Khi GPA bằng nhau, sName là khóa sau và mặc định ASC. Vị trí NULL còn phụ thuộc hệ quản trị nếu không chỉ định rõ.');
  add(20,'joins','Với SELECT cName ... (không ghi tên bảng trước cName), mệnh đề FROM nào KHÔNG gây lỗi tên cột mơ hồ?',[
    'FROM COLLEGE JOIN APPLY ON COLLEGE.cName = APPLY.cName',
    'FROM COLLEGE, APPLY WHERE COLLEGE.cName = APPLY.cName',
    'FROM COLLEGE C, APPLY A WHERE C.cName = A.cName',
    'FROM COLLEGE NATURAL JOIN APPLY',
  ],3,'NATURAL JOIN gộp các cột chung thành một bản trong bảng kết quả nên cName không còn hai bản mơ hồ. Các dạng ON hoặc WHERE so sánh bằng không tự gộp tên cột.');
  add(21,'subquery','Với truy vấn SELECT sName FROM STUDENT S1 WHERE ..., điều kiện nào tìm đúng các sinh viên có GPA cao nhất, kể cả khi nhiều người đồng hạng?',[
    'WHERE NOT EXISTS (SELECT * FROM STUDENT S2 WHERE S2.GPA > S1.GPA)',
    'WHERE GPA > ANY (SELECT GPA FROM STUDENT)',
    'WHERE EXISTS (SELECT * FROM STUDENT S2 WHERE S2.GPA < S1.GPA)',
    'WHERE GPA > ALL (SELECT GPA FROM STUDENT)',
  ],0,'Không tồn tại người có GPA lớn hơn là điều kiện xác định các mức GPA cao nhất đã biết, giữ được nhiều người đồng hạng. So sánh > ALL trên cả bảng không giữ người đạt cực đại vì họ không lớn hơn chính mình.', '',
  'Đáp án PDF giả định GPA không NULL. Nếu có NULL, NOT EXISTS này cũng giữ hàng GPA NULL; cần thêm S1.GPA IS NOT NULL để chỉ lấy cực đại của các giá trị đã biết.');
  add(22,'null','Bảng STUDENT có 10 dòng, trong đó 2 dòng có GPA là NULL. Truy vấn sau trả về bao nhiêu dòng?',[
    '2 dòng, chỉ gồm những dòng có GPA là NULL',
    '10 dòng, vì điều kiện luôn đúng với mọi giá trị',
    '8 dòng, những dòng có GPA là NULL bị loại',
    'Truy vấn báo lỗi do so sánh với giá trị NULL',
  ],2,'Mọi GPA đã biết thỏa một trong hai phía. Với NULL, cả hai so sánh là UNKNOWN; UNKNOWN OR UNKNOWN vẫn UNKNOWN và không được WHERE giữ lại.',
  'SELECT sID FROM STUDENT\nWHERE GPA > 3.5 OR GPA <= 3.5;');
  add(23,'subquery','Biểu thức GPA * (sizeHS / 1000.0) (scaledGPA) phải viết lặp lại cả trong SELECT lẫn WHERE. Cách nào giúp chỉ viết biểu thức này một lần?',[
    'Tính trong truy vấn con ở FROM rồi lọc ở truy vấn ngoài',
    'Dùng GROUP BY theo biểu thức scaledGPA đó',
    'Đặt biểu thức vào ORDER BY để dùng lại trong WHERE',
    'Tạo chỉ mục trên cột GPA để hệ thống tự tính trước',
  ],0,'Bảng dẫn xuất có thể xuất biểu thức AS scaledGPA. Truy vấn ngoài xem scaledGPA như một cột của nguồn, nên có thể lọc mà không viết lại công thức.');
  add(24,'aggregation','Cần đếm số sinh viên (không phải số đơn) đã nộp vào Cornell. Biểu thức nào phù hợp để điền vào chỗ trống?',[
    'COUNT(sID)', 'COUNT(cName)', 'COUNT(*)', 'COUNT(DISTINCT sID)',
  ],3,'Một sinh viên có thể nộp nhiều ngành vào Cornell. COUNT(DISTINCT sID) đếm mỗi mã một lần, còn COUNT(*) hoặc COUNT(sID) đếm các đơn tương ứng.',
  "SELECT ___ FROM APPLY WHERE cName = 'Cornell';");
  add(25,'aggregation','Cần tìm các trường có ít hơn 5 người nộp đơn. Mệnh đề nào phù hợp để điền vào chỗ trống?',[
    'HAVING COUNT(cName) < 5', 'HAVING COUNT(*) < 5',
    'WHERE COUNT(DISTINCT sID) < 5', 'HAVING COUNT(DISTINCT sID) < 5',
  ],3,'Đếm người cần DISTINCT sID; điều kiện trên số đếm của nhóm đặt ở HAVING, không ở WHERE.',
  'SELECT cName FROM APPLY GROUP BY cName ___;',
  'Truy vấn gốc chỉ tạo nhóm cho trường đã xuất hiện trong APPLY. Muốn tính cả trường có 0 người nộp, cần xuất phát từ COLLEGE và dùng LEFT JOIN hoặc truy vấn con.');
  add(26,'aggregation','Câu truy vấn nào tính đúng GPA trung bình của các sinh viên có nộp ngành CS (mỗi sinh viên được tính đúng một lần)?',[
    "SELECT AVG(GPA) FROM STUDENT JOIN APPLY USING(sID) WHERE major='CS'",
    "SELECT AVG(DISTINCT GPA) FROM STUDENT JOIN APPLY USING(sID) WHERE major='CS'",
    "SELECT AVG(GPA) FROM STUDENT WHERE sID IN (SELECT sID FROM APPLY WHERE major='CS')",
    "SELECT DISTINCT AVG(GPA) FROM STUDENT JOIN APPLY USING(sID) WHERE major='CS'",
  ],2,'IN chọn các hàng STUDENT theo việc có đơn CS, không nhân bản một sinh viên có nhiều đơn. AVG(DISTINCT GPA) lại gộp các người khác nhau có cùng GPA, còn DISTINCT bên ngoài AVG không sửa được trọng số đã bị nhân ở JOIN.');
  add(27,'subquery','Có 4 sinh viên cùng đạt GPA cao nhất là 3.9. Truy vấn sau cho kết quả gì?',[
    'Tên mọi sinh viên, trừ người có GPA thấp nhất',
    'Tên của cả 4 sinh viên có GPA bằng 3.9',
    'Không có dòng nào, kết quả là tập rỗng',
    'Tên của một sinh viên bất kỳ trong 4 người đó',
  ],2,'Mỗi người GPA 3.9 vẫn phải so sánh > với ba người 3.9 còn lại, nên không thỏa. Người có GPA thấp hơn cũng không lớn hơn tất cả những người còn lại.',
  'SELECT sName FROM STUDENT S1\nWHERE GPA > ALL (SELECT GPA FROM STUDENT S2\n                 WHERE S2.sID <> S1.sID);');
  add(28,'basic','Có hai sinh viên khác nhau cùng tên Craig, cả hai đều nộp ngành CS. Khi dùng SELECT DISTINCT sName ... để lấy tên sinh viên nộp CS, kết quả về Craig là gì?',[
    'Một dòng Craig, hai sinh viên khác nhau bị gộp làm một',
    'Không có dòng Craig nào, vì tên này bị trùng lặp',
    'Truy vấn báo lỗi vì giá trị trong cột sName không duy nhất',
    'Hai dòng Craig, vì DISTINCT so sánh theo khóa sID',
  ],0,'DISTINCT xét toàn bộ các cột được SELECT, ở đây chỉ có sName. Mã sinh viên không nằm trong kết quả nên không giúp phân biệt hai dòng tên Craig.');
  add(29,'null','Cột GPA có 7 giá trị khác nhau (không kể NULL) và một số dòng là NULL. Kết quả của COUNT(DISTINCT GPA) và số dòng của SELECT DISTINCT GPA lần lượt là:',[
    '8 và 7', '7 và 8', '7 và 7', '8 và 8',
  ],1,'COUNT(DISTINCT GPA) bỏ NULL nên đếm 7 giá trị. SELECT DISTINCT GPA giữ một đại diện NULL cùng 7 giá trị đã biết nên có 8 hàng.');
  add(30,'subquery',"Đặt Q_CS = (SELECT sID FROM APPLY WHERE major='CS'), Q_EE = (SELECT sID FROM APPLY WHERE major='EE'), Q_notEE = (SELECT sID FROM APPLY WHERE major<>'EE'). Điều kiện nào tìm đúng sinh viên nộp CS nhưng không nộp EE?",[
    'sID IN Q_CS AND sID NOT IN Q_notEE',
    'sID IN Q_CS AND sID NOT IN Q_EE',
    'sID IN Q_CS OR sID NOT IN Q_EE',
    'sID IN Q_CS AND sID IN Q_notEE',
  ],1,'Cần đồng thời thuộc tập đã nộp CS và không thuộc tập đã nộp EE. Có một đơn ngành khác EE không chứng minh người đó chưa từng nộp EE.', '',
  'Cách viết Q_CS/Q_EE là ký hiệu rút gọn của đề. Đáp án NOT IN dựa trên sID không NULL trong dữ liệu bài giảng; cần xử lý NULL nếu dữ liệu thực tế cho phép.');
  add(31,'joins','Đếm số đơn của mỗi sinh viên bằng truy vấn sau. Sinh viên chưa nộp đơn nào thì thế nào?',[
    'Xuất hiện với số đếm bằng 1', 'Xuất hiện với số đếm bằng 0',
    'Xuất hiện với số đếm là NULL', 'Không xuất hiện trong kết quả',
  ],3,'INNER JOIN chỉ giữ sinh viên có đơn khớp trước khi GROUP BY. Người không có đơn đã bị loại, nên không có nhóm để hiển thị số 0.',
  'SELECT sID, COUNT(*)\nFROM STUDENT JOIN APPLY USING(sID) GROUP BY sID;');
  add(32,'null','Điều kiện nào lọc đúng các sinh viên chưa có GPA (GPA là NULL)?',[
    'WHERE GPA IS NULL', 'WHERE GPA IN (NULL)', "WHERE GPA = ''", 'WHERE GPA = NULL',
  ],0,'IS NULL kiểm tra sự thiếu giá trị. So sánh GPA = NULL hoặc IN(NULL) không tạo TRUE để WHERE giữ hàng; chuỗi rỗng cũng không đồng nghĩa GPA thiếu.');
  add(33,'subquery','Điều kiện nào lọc đúng các sinh viên KHÔNG nộp đơn vào ngành EE?',[
    "sID IN (SELECT sID FROM APPLY WHERE major <> 'EE')",
    "NOT sID = ALL (SELECT sID FROM APPLY WHERE major = 'EE')",
    "sID <> ANY (SELECT sID FROM APPLY WHERE major = 'EE')",
    "sID <> ALL (SELECT sID FROM APPLY WHERE major = 'EE')",
  ],3,'Không thuộc tập mã nộp EE nghĩa là khác mọi mã trong tập, diễn đạt bằng <> ALL (tương ứng NOT IN với giả định NULL phù hợp). <> ANY chỉ yêu cầu khác ít nhất một người nộp EE.');
  add(34,'subquery',"Điều kiện sID <> ANY (SELECT sID FROM APPLY WHERE major = 'EE') cho kết quả TRUE khi nào?",[
    'Khi sinh viên đang xét chưa từng nộp ngành EE',
    'Khi không có sinh viên nào nộp ngành EE',
    'Khi sinh viên đang xét là người duy nhất nộp EE',
    'Khi có ít nhất một người nộp EE khác sinh viên đang xét',
  ],3,'ANY có nghĩa tồn tại ít nhất một giá trị làm phép so sánh đúng. Một người có nộp EE vẫn có thể thỏa nếu còn một người khác cũng nộp EE có mã khác.');
  add(35,'subquery','Khi đặt truy vấn con trong mệnh đề FROM, hầu hết các hệ quản trị bắt buộc điều gì?',[
    'Truy vấn con phải có mệnh đề ORDER BY',
    'Truy vấn con chỉ được trả về một cột',
    'Truy vấn con phải được đặt bí danh',
    'Truy vấn con không được chứa phép join',
  ],2,'Đáp án bài giảng yêu cầu alias cho bảng dẫn xuất để tham chiếu rõ ràng, ví dụ FROM (SELECT ...) AS Q. Đây cũng là cách viết rõ nghĩa và dễ dùng trên nhiều DBMS.', '',
  'Quy tắc phụ thuộc hệ quản trị và phiên bản: PostgreSQL từ phiên bản 16 cho phép bỏ alias cho truy vấn con trong FROM. Khi luyện bộ đề này, đáp án vẫn chấm theo PDF.',
  'https://www.postgresql.org/docs/16/release-16.html');
  add(36,'aggregation','Khi nào việc đưa một cột không thuộc GROUP BY vào SELECT vẫn cho kết quả có nghĩa?',[
    'Khi cột đó có kiểu dữ liệu số',
    'Khi truy vấn có thêm mệnh đề HAVING',
    'Khi cột đó chứa giá trị NULL trong nhóm',
    'Khi cột phụ thuộc vào cột nhóm, như sName theo sID',
  ],3,'Nếu cột nhóm định danh duy nhất người, mọi hàng trong nhóm cùng có một sName tương ứng, nên chọn tên đó có nghĩa. DBMS còn cần nhận diện hoặc hỗ trợ phụ thuộc hàm phù hợp để chấp nhận cú pháp.');
  add(37,'updates','Khi xóa một sinh viên khỏi bảng STUDENT (không khai báo ràng buộc gì thêm, như trong bài giảng), các đơn của sinh viên đó trong APPLY thế nào?',[
    'Khiến hệ thống báo lỗi và hủy lệnh xóa',
    'Vẫn còn nguyên, phải xóa riêng',
    'Bị xóa theo một cách tự động',
    'Được đặt giá trị sID thành NULL',
  ],1,'Không có khóa ngoại và hành động tham chiếu thì xóa ở STUDENT không tự lan sang APPLY. Muốn chặn, xóa dây chuyền hoặc đặt NULL phải có ràng buộc/cơ chế tương ứng được thiết kế.');
  add(38,'null','Một sinh viên có GPA là NULL và sizeHS = 1000. Với WHERE GPA > 3.5 OR sizeHS < 1600, dòng của sinh viên này thế nào?',[
    'Được giữ, vì UNKNOWN OR TRUE cho kết quả TRUE',
    'Bị loại, vì có một vế của điều kiện là UNKNOWN',
    'Truy vấn báo lỗi khi gặp giá trị GPA là NULL',
    'Được giữ, nhưng cột GPA được hiển thị là 0',
  ],0,'Vế GPA > 3.5 là UNKNOWN, nhưng 1000 < 1600 là TRUE. Một vế TRUE đủ làm OR thành TRUE; giá trị GPA gốc vẫn là NULL.');
  add(39,'updates','Một số hệ quản trị không cho phép DELETE khi truy vấn con trong WHERE tham chiếu chính bảng đang xóa. Cách khắc phục được nêu trong bài giảng là gì?',[
    'Bỏ mệnh đề WHERE, xóa toàn bộ bảng rồi chèn lại dữ liệu',
    'Đổi DELETE thành UPDATE và đặt mọi cột của dòng đó là NULL',
    'Thêm ORDER BY vào truy vấn con để cố định thứ tự các dòng',
    'Lưu kết quả truy vấn con vào bảng tạm rồi xóa theo bảng tạm',
  ],3,'Tách việc xác định các khóa mục tiêu sang bảng tạm giúp lệnh DELETE tham chiếu tập đã tính thay vì truy vấn trực tiếp bảng đang sửa theo cách bị DBMS hạn chế. Cú pháp và các cách viết khác phụ thuộc hệ quản trị.');
  add(40,'subquery','Phát biểu nào đúng về ANY/ALL theo bài giảng?',[
    'Lỗi khi dùng ANY/ALL thường dễ phát hiện bằng cách xem kết quả',
    'Mọi truy vấn dùng ANY/ALL đều viết lại được bằng EXISTS/NOT EXISTS',
    'ANY/ALL là cách duy nhất để so sánh với kết quả của truy vấn con',
    'SQLite đã hỗ trợ đầy đủ ANY/ALL tại thời điểm của bài giảng',
  ],1,'ANY diễn đạt sự tồn tại; ALL diễn đạt không có phản ví dụ. Các ý định đó có thể biểu diễn bằng các truy vấn EXISTS/NOT EXISTS phù hợp.', '',
  'Khi có NULL và cần bảo toàn cả TRUE/FALSE/UNKNOWN, không thay ALL bằng NOT EXISTS của phép so sánh phủ định một cách máy móc; cần xét riêng trường hợp UNKNOWN và tập rỗng.');
  window.CSDL_ASSESSMENTS = [{
    id:'kiem-tra-2', title:'Kiểm tra lần 2', source,
    sourceFile:'Kiểm tra lần 2_ Xem lại lần làm thử _ Courses.pdf',
    description:'40 câu và đáp án từ bản xem lại bài làm trên Courses. Giữ nguyên thứ tự câu, lựa chọn A–D và đáp án; chuẩn hóa lỗi giãn chữ khi trích PDF, tách SQL để dễ đọc. Giải thích và ghi chú ngữ cảnh do CSDL Studio bổ sung.',
    questions,
  }];
})();
