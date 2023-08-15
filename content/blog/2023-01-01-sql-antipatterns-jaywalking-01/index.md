---
title: SQL Antipatterns - Jaywalking (01)
date: "2023-01-01T00:00:00.000Z"
description: "SQL Antipatterns: Jaywalking"
tags: ["sql", "antipatterns", "database"]
---
### Related posts
> - [Các bài posts về Antipatterns](//tags/antipatterns)

### Summary
> - [I. Antipattern là gì?](#01)
>   - [1. Khái niệm](#01_01)
>   - [2. Cấu trúc database minh họa](#01_02)
> - [II. Jaywalking](#02)
>   - [1. Mục đích](#02_01)
>   - [2. Antipatterns](#02_02)
>   - [3. Phát hiện Antipatterns](#02_03)
>   - [4. Khi nào sử dụng Antipattern](#02_04)
>   - [5. Giải pháp thay thế](#02_05)
>   - [6. Mini-Antipatterns](#02_06)


## <a name="01"></a>I. Antipattern là gì?
#### <a name="01_01"></a>1. Khái niệm
Antipattern là cách gọi chung của 1 kỹ thuật giải quyết một vấn đề nhưng thường tạo ra các vấn đề khác. Thông thường bằng một cách vô tình hay cố ý ta thường giải quyết một vấn đề nào đó bằng cách áp dụng một antipattern nào đó.

Trong các bài posts sắp tới của chuỗi các bài về SQL Antipatterns ta sẽ gặp rất nhiều antipatterns hay được sử dụng, từ đó chúng ta phân tích, đánh giá và tìm các giải pháp thay thế cho các Antipatterns này.

Chúng ta có thể phân loại các SQL Antipatterns thành 4 loại:
- **Logical Database Design Antipatterns**: Ngay ở giai đoạn planing và design ta phải quyết định những thông tin/data gì được tổ chức và lưu trữ trong database. Các Antipatterns này liên quan đến planing và designing tables, columns và relationships.
- **Physical Database Design Antipatterns**: Sau khi đã biết những data gì cần lưu trữ thì chúng ta triển khai các quản lý các data này hiệu quả, bao gồm định nghĩa các tables, index và chọn loại data.
- **Query Antipatterns**: Thêm, xóa, sửa và query data trong database.
- **Application Development Antipatterns**: Khi SQL hỗ trợ để làm việc với tầng application (programming languages)

Ở mỗi Antipattern ta đều làm việc theo thứ tự với các phần rõ ràng để hiểu về một Antipattern:
- **Mục đích**
- **Mô tả Antipattern**
- **Làm sao phát hiện Antipattern**
- **Khi nào được sử dụng Antipattern**
- **Giải pháp thay thế**


#### <a name="01_02"></a>2. Cấu trúc database minh họa
Trong các bài post tiếp theo về Antipatterns chúng ta sẽ minh họa và làm việc dựa trên database bên dưới, một phần mềm bug-tracking.

Chứa các tables cơ bản như sau:

> Table `Accounts`: Chứa đựng các thông tin về một account trong hệ thống
```sql
-- Accounts
CREATE TABLE Accounts(
  account_id      SERIAL PRIMARY KEY
  account_name    VARCHAR(20),
  first_name      VARCHAR(20),
  last_name       VARCHAR(20),
  email           VARCHAR(100),
  password_hash   CHAR(64),
  portrait_image  BLOB,
  hourly_rate     NUMERIC(9,2)
)

```

> Table `BugStatus`: Các tình trạng của Bug
```sql
-- BusStatus
CREATE TABLE BugStatus(
  status    VARCHAR(20)   PRIMARY KEY
)

```

> Table `Bugs`: Thông tin về một bug
```sql
-- Bugs
CREATE TABLE Bugs(
  bug_id          SERIAL PRIMARY KEY,
  date_reported   DATE NOT NULL DEFAULT(CURDATE()),
  summary         VARCHAR(80),
  description     VARCHAR(1000),
  resolution      VARCHAR(1000),
  reported_by     BIGINT UNSIGNED NOT NULL,
  assigned_to     BIGINT UNSIGNED,
  verified_by     BIGINT UNSIGNED,
  status          VARCHAR(20) NOT NULL DEFAULT 'NEW',
  priority        VARCHAR(20),
  hours           NUMERIC(9,2)

  FOREIGN KEY(reported_by)  REFERENCES Accounts(account_id),
  FOREIGN KEY(assigned_to)  REFERENCES Accounts(account_id),
  FOREIGN KEY(verified_by)  REFERENCES Accounts(account_id),
  FOREIGN KEY(status)       REFERENCES BugStatus(status),
)
```

> Table `Comments`: Thông tin về một comment
```sql
-- Bugs
CREATE TABLE Bugs(
  bug_id          SERIAL PRIMARY KEY,
  date_reported   DATE NOT NULL DEFAULT(CURDATE()),
  summary         VARCHAR(80),
  description     VARCHAR(1000),
  resolution      VARCHAR(1000),
  reported_by     BIGINT UNSIGNED NOT NULL,
  assigned_to     BIGINT UNSIGNED,
  verified_by     BIGINT UNSIGNED,
  status          VARCHAR(20) NOT NULL DEFAULT 'NEW',
  priority        VARCHAR(20),
  hours           NUMERIC(9,2)

  FOREIGN KEY(reported_by)  REFERENCES Accounts(account_id),
  FOREIGN KEY(assigned_to)  REFERENCES Accounts(account_id),
  FOREIGN KEY(verified_by)  REFERENCES Accounts(account_id),
  FOREIGN KEY(status)       REFERENCES BugStatus(status),
)
```