---
title: Một vài design patterns phổ biến trong Rails - Phần 01
date: "2021-09-01T22:12:03.284Z"
description: "Một số design patterns hay dùng trong Rails project"
tags: ["rails", "design pattern"]
---
> - [Builder](#builder)
> - [Decorator](#decorator)
> - [Form](#)
> - [Interactor](#)
> - [Observer](#)
> - [Policy](#)
> - [Presenter](#)
> - [Query](#)
> - [Service](#)
> - [Value](#)

Design Patterns là các best practices bằng các tổ chức và xây dựng code để giải quyết các bài toán cụ thể, mỗi design pattern sẽ nhắm tới một vấn đề cụ thể.

Ở trên là các Design Patterns hay được sử dụng trong các dự án Rails, một số hay được dùng ở View, một số dùng ở Model, số còn lại có thể  tự do sử dụng ở mọi nơi.

Việc sử dụng design pattern có những điểm lợi và những việc bất lợi riêng (nên có một số người theo style anti-patterns) nhưng nhìn chung mà nói thì lợi nhiều hơn hại.

* Một số  *`lợi ích`* dễ thấy nhờ việc apply design patterns trong dự án:
    - **Thói quen**: Với một số luồng logic/business nhất định, chúng ta có thể "ép khuôn" nó bằng cách dùng các design pattern để nó theo 1 flow nhất định, không cần phải tốn công suy nghĩ cấu trúc code mới.
    - **Cải thiện cách dùng OOP**: Sau một thời gian làm việc với các patterns bạn sẽ có cái nhìn về các Object ở những góc độ khác nhau từ đó nâng cao trình độ của bản thân.
    - **Hiểu thêm về các library**: Việc apply các patterns giúp bạn thoải mái hơn nhiều khi đọc lại code của các Libraries hay dùng bởi vì code của một library thường được tổ chức và xây dựng theo 1 hoặc nhiều patterns nào đó
    - **Chuẩn hóa**: Thống nhất style code và các tổ chức code giữa các member trong team. Mọi người sẽ ít bị khó khăn hơn khi đọc code của nhau.
    - **Cải thiện cách suy nghĩ**: Bạn sẽ hấp thu được các ý tưởng đằng sau một design pattern nào đó từ đó giúp bạn khám phá nhiều các mới để tổ chức code base và cấu trúc dự án.

* Bên cạnh đó cũng có những điểm *`bất lợi`*:
    - **Cần kiến thức**: Việc sử dụng một design pattern trong project yêu cầu mọi thành viên trong team phải có kiến thức về nó, nếu không có thì việc này sẽ cần một chút thời gian để làm quen và tiếp thu.
    - **Lối mòn suy nghĩ**: Việc dùng các design pattern khiến chúng ta quen thuộc với "khuôn suy nghĩ" cũ và sáng tạo khi code. Nên nhớ "Luôn luôn có nhiều cách để giải quyết một vấn đề"
    - **Overthinking và Overkill**: Áp dụng design patterns cho 1 use case hoặc scope quá nhỏ là việc không cần thiết và làm phức tạp dự án. Để xác định có nên áp dụng Design Patterns hay không cần sự đồng thuận của các thành viên trong team.


## Các Design Pattern phổ biến
------
#### <a name="builder"></a>Builder

The Builder pattern makes the construction of complex objects gradual and straightforward. It is also known as Adapter, and its primary purpose is to simplify the object instantiation process.

###### Vấn đề
Imagine if you were building a highly customized car. You would need multiple stages of development—internal structure or chassis, engine, and related machinery, outer body structure, designing and decals, and other comfort-related installations like dashboard, seats, etc. If you were to represent this process via classes, you would have one colossal class constructor that would take in all of these preferences as arguments. But that can get too cluttered for creating a basic, economy four-wheeler. This is where the concept of builders kicks in.

###### Giải pháp

Like the way a car goes through a series of steps in an assembly, the builder pattern splits the construction of any object into a series of small and gradual steps. For the car example, there would be a ChassisBuilder, PerformanceBuilder, BodyBuilder, InstallationBuilder, and more, at each step of the car assembly process. The output of each of these builder interfaces would be an input to the next. This way, you don’t need to maintain one huge constructor for your Car class that can get prone to errors.

###### Use Cases
    - aaa
    - bbb

###### Ví dụ cụ thể

```ruby
class BaseParser
    def initialize(path)
        @path = path
    end
end

class PdfFileParser < BaseParser
    def toString
        # return a string
    end
end

class JpegFileParser < BaseParser
    def toString
         # return a string
    end
end
```

###### Các gems giúp code kiểu design pattern này
    - aaa
    - bbb
------
#### <a name="decorator"></a>Decorator

The Builder pattern makes the construction of complex objects gradual and straightforward. It is also known as Adapter, and its primary purpose is to simplify the object instantiation process.

###### Vấn đề
Imagine if you were building a highly customized car. You would need multiple stages of development—internal structure or chassis, engine, and related machinery, outer body structure, designing and decals, and other comfort-related installations like dashboard, seats, etc. If you were to represent this process via classes, you would have one colossal class constructor that would take in all of these preferences as arguments. But that can get too cluttered for creating a basic, economy four-wheeler. This is where the concept of builders kicks in.

###### Giải pháp

Like the way a car goes through a series of steps in an assembly, the builder pattern splits the construction of any object into a series of small and gradual steps. For the car example, there would be a ChassisBuilder, PerformanceBuilder, BodyBuilder, InstallationBuilder, and more, at each step of the car assembly process. The output of each of these builder interfaces would be an input to the next. This way, you don’t need to maintain one huge constructor for your Car class that can get prone to errors.

###### Use Cases
    - aaa
    - bbb

###### Ví dụ cụ thể

```ruby
class BaseParser
    def initialize(path)
        @path = path
    end
end

class PdfFileParser < BaseParser
    def toString
        # return a string
    end
end

class JpegFileParser < BaseParser
    def toString
         # return a string
    end
end
```

###### Các gems giúp code kiểu design pattern này
    - aaa
    - bbb