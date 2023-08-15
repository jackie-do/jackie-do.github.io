---
title: 10 Sai lầm Rail Developer hay mắc phải
date: "2022-12-05T22:12:03.284Z"
description: "10 Sai lầm Rail Developer hay mắc phải"
tags: ["rails", "architecture"]
---
> - [1. Đặt quá nhiều logic ở Controllers](#01)
> - [2. Đặt quá nhiều logic ở Views](#02)
> - [3. Đặt quá nhiều logic ở Models](#03)
> - [4. Nên sử dụng các helper class hợp lý](#04)
> - [5. Sử dụng quá nhiều Gems](#05)
> - [6. Không lưu ý Log Files](#06)
> - [7. Thiếu automated tests](#07)
> - [8. Bị block khi gọi các external services](#08)
> - [9. Bị trói buộc bởi database migrations hiện tại](#09)
> - [10. Để các data nhạy cảm ở source code](#10)


## <a name="01"></a>1. Đặt quá nhiều logic ở Controllers
Rails nổi tiếng với kiến trúc quen thuộc MVC, và mọi người hay dùng thuật ngữ "Fat model, skinny controller" trong một thời gian dài để ám chỉ việc ta nên đặt logic ở các Models và tinh gọn logic ở các Controllers.

Việc đặt quá nhiều logic ở Controller sẽ vi phạm [Single Responsibility Principle](https://www.toptal.com/software/single-responsibility-principle) trong coding.

Thông thường, chúng ta chỉ nên đặt một số loại logic sau ở controllers:
- *Xử lý Session và Cookies (bao gồm cả việc Authentication và Authorization)*
- *Chọn Models, Services ... để xử lý các business logic*
- *Quản lý và xử lý các parameters được gửi từ clients*
- *Rendering/Redirecting*

## <a name="02"></a>2. Đặt quá nhiều logic ở Views
Nên tránh đặt quá nhiều logic ở phần View (server render side), cố gắng chia tách để tái sử dụng nhất có thể.

Với 1 view được viêt bằng EKB trong Rails bên dưới, ta thấy ở đây sử dụng điều kiện rẽ nhánh để render view phù hợp.

```erb
<h3>
    Welcome,
    <% if current_user %>
        <%= current_user.name %>
    <% else %>
        Guest
    <% end %>
</h3>
```

Các tiếp cận tốt hơn là sử dụng helper hoặc design pattern để build data cho view ở controller (bằng cách áp dụng design pattern Facade chẳng hạn).

Ví dụ ta tạo 1 helper method (để có thể sử dụng method này ở View) ở Controller
```ruby
require 'ostruct'

helper_method :current_user

def current_user
    @current_user ||= User.find session[:user_id] if session[:user_id]
    if @current_user
        @current_user
    else
      OpenStruct.new(name: 'Guest')
    end
end
```

Bằng cách này ta có thể đơn giản hóa logic ở View như sau

```erb
<h3>Welcome, <%= current_user.name -%></h3>
```

Đối với View, ta nên lưu ý một số điểm sau:
- *Sử dụng layout và chia tách partial views phù hợp để có tính biệt lập và có khả năng tái sử dụng cao.*
- *Sử dụng presenters/decorators (bằng cách dùng gem Draper hay Facade pattern) để đảm bảo tính bao đóng (encapsulate) cho view-building logic. Nên đặt các method handle logic ở các object Ruby thay vì để trực tiếp trong Rails*

## <a name="03"></a>3. Đặt quá nhiều logic ở Models
Ở 2 mục trên ta đã nói ko nên đặt quá nhiều logic ở Controller và View, vậy nên chỉ còn đúng 1 chỗ để đặt logic trong mô hình MVC là Model có phải không ?

Đúng nhưng không đúng hoàn toàn!

Rất nhiều Rails developer đặt toàn bộ logic vào Model của Rails, dấn đến việc vi phạm nguyên tắc S của SOLID (Single Responsibility Principle) và gây khó khắn rất nhiều cho việc maintain code base.

Đặc biệt một số logic như: tạo và gửi emails, tương tác với các external services, convert format ... ko nên đặt trong Model.

Khi các logic ở Model trở nên cồng kềnh và phức tạp cách tốt nhất là ta nên "dời" các logic này vào các POROs (Plain Old Ruby Object). Tạo các Ruby object để handle cho các logics này, dễ gặp nhất là các `services`, `interactors` ... Việc chia tách này sẽ giảm tính phức tạp, dễ test hơn, dễ maintain hơn cho sau này.

Chốt lại ở Model chúng ta chỉ nên để các logic như:
- *ActiveRecord configuration - như là relations, validations*
- *Simple Mutation Methods - Những method liên quan tới việc xóa sửa attributes trong database*
- *Access Wrapper - tạo ra những methods mới để lấy thông tin (ví dụ full_name method là kết hợp của first_name và last_name attribute)*
- *Sophisticated queries - định nghĩa những method hỗ trợ truy vấn phức tạp từ database*


## <a name="04"></a>4. Nên sử dụng các helper class hợp lý
Rails được xây dựng dựa trên mô hình MVC, nhưng đôi khi ta sẽ thấy sẽ có một số logic không "fit" với Model hoặc View hoặc Controller. Đây là lúc ta nên suy nghĩ về việc tạo ra các custom helper class để chứa các logic của mình.
Tuy mặc định Rails đã có 1 thư mục `helpers`, nhưng tốt nhất nên hạn chế đặt logic ở đây, các helpers này chỉ nên được sử dụng hạn chế ở View.

Như ta đã thấy ở mục 3, ta có thể dời các logic của mình vào các POROs, các Ruby objects này thường được đặt trong `services`, `interactors` ...
Dù cho Rails được xây trên mô hình MVC ko có nghĩa ta sẽ bị trói buộc chỉ làm việc với MVC, ta hoàn toàn có thể sáng tạo để có 1 code base được design kiểu object-oriented tốt bằng cách sử dụng các helper class phù hợp


## <a name="05"></a>5. Sử dụng quá nhiều Gems
Một hệ sinh thái đầy đủ các lib/gems là một trong nhưng ưu điểm tuyệt vời của Rails, tuy nhiên việc quá lạm dụng các gem lại là một điểm yếu thường thấy của các Rails developer.

Càng nhiều gem được add vào thì kích thước của Rails process càng lớn và càng làm giảm performance => tiêu tốn nhiều memory hơn và tăng chi phí vận hành hơn.

Nên cân nhắc kỹ càng trước khi add một gem mới vào.

## <a name="06"></a>6. Không lưu ý Log Files

Trong khi phần lớn các Rails developers biết tới default log file, chỉ có một ít developers thực sự chú ý tới thông tin của file này ở môi trường Production. Trên môi trường production các tool như [Honeybadger](https://www.honeybadger.io/) hay [New Relic](https://newrelic.com/) sẽ giúp đỡ chúng ta quản lý giám sát các log file này tốt hơn. Tuy vậy chúng ta cũng phải luôn phải luôn lưu ý nội dung của log files ở môi trường develop và test.

Hầu hết các tác vụ trong Rails diễn ra chủ yếu ở tầng Model. Bằng cách định nghĩa các associations trong models, thật dễ dàng để chúng ta lấy các thông tin của các relations và hiện mọi thứ lên để xem. Việc tạo ra SQL để lấy data được sinh ra tự động, điều đó thật tuyệt nhưng làm sao chúng ta biết SQL được sinh ra có hiệu quả và tối ưu hay không ?

Một trong các issue thường gặp là **N+1 query**, issue này khó mà phát hiện bằng mắt thường ở view người dùng thông thường nhưng chúng ta lại có thể dễ dàng phát hiện nếu check log kỹ càng.

Nên việc review log ở development và test có một cách rất hay và hiệu quả để tối ưu code phòng ngừa các vấn đề trước khi code được đưa lên production.

## <a name="07"></a>7. Thiếu automated tests

Ruby và Rails mặc định cung cấp các công cụ automated tests, rất nhiều Rails devs viết những bộ tests phức tạp sử dụng TDD và BDD bằng các testing framework như `rspec` và `cucumber`.

Mặc dù các công cụ viết tests có sẵn và hỗ trợ rất nhiều nhưng chúng ta sẽ ngạc nhiên với số lượng các project *không được viết test*. Mặc dù sẽ có một số tranh cãi về việc apply tests và apply tới mức nào, nhưng có một điều không cần bàn cãi là sẽ cần có *một vài bộ tests* mà tất cả projects nào cũng nên có.

Theo nguyên tắc chung, chúng ta phải có tối thiểu 1 high-level integration test được viết cho mỗi action của controllers. Với bộ test tối thiểu này thì trong tương lai khi có những thay đổi, mở rộng chức năng thì chúng ta có thể an tâm là phần thay đổi, mở rộng không ảnh hưởng tới các chức năng hiện có. Ngoài ra, việc viết test cũng cung cấp một định nghĩa và phân định rõ ràng các chức năng của hệ thống

## <a name="08"></a>8. Bị block khi gọi các external services

Các Third-party provider services trong Rails thường có xu hướng tích hợp dịch vụ của họ thông qua việc sử dụng các gems (đóng gói các APIs của họ). Nó giúp ta tiện lợi trong quá trình sử dụng nhưng cũng dẫn tới một vài vấn đề khi dịch vụ của họ bị chậm hoặc không hoạt động ổn định.

Đê tránh việc bị block khi sử dụng các dịch vụ ngoài này, thay vì chúng ta call các services này trực tiếp thì nếu có thể ta nên chuyển việc call các dịch vụ này vào background job-queuing service. Một vài gem phổ biến trong Rails phục vụ mục đích này như:

- [Delayed Job](https://github.com/collectiveidea/delayed_job)
- [Resque](https://github.com/resque/resque)
- [Sidekiq](https://github.com/sidekiq/sidekiq)

Trong trường hợp không thể chuyển việc call các service này cho background job queue, chúng ta nên đảm bảo hệ thống được xây dựng với khả năng handle error và fail-over provision hiệu quả. Cần test thử các case unsuccess khi sử dụng các third-party services.


## <a name="09"></a>9. Bị trói buộc bởi database migrations hiện tại

Rails’ database migration mechanism allows you to create instructions to automatically add and remove database tables and rows. Since the files that contain these migrations are named in a sequential fashion, you can play them back from the beginning of time to bring an empty database to the same schema as production. This is a great way to manage granular changes to your application’s database schema and avoid Rails problems.

Rails database migration giúp chúng ta dễ dàng hơn trong việc thêm, xóa, sửa cấu trúc database. Bởi vì các file migrate chức các mã số tuần tự nên chúng ta có thể dễ dàng điều chỉnh các migrations theo ý chúng ta muốn. Đây là một cách tuyệt vời để quản lý database schema.

Nhưng theo thời gian việc tạo database dựa trên các migration files sẽ tốn nhiều thời gian hơn, hoặc có sự sai sót trong cái migration files như thiếu file, sai thứ tự ...

Mặc định Rails tạo 1 file thể hiện schema hiện tại của database là file `db/schema.rb`. File này thường được cập nhật khi có 1 migration file được thực thi. Chúng ta cũng có thể tạo ra file này bằng cách chạy câu lệnh `rake db:schema:dump`.

Khi số lượng migration files quá nhiều/tốn quá nhiều thời gian để chạy/không tại ra database schema chính xác, đừng sợ hãi mà hãy dọn sạch thư mục chứa migration files: dump một schema mới, xóa các migration files cũ, tạo database dựa trên file dump vừa tạo, tiếp tục viết các file migration mới.

Lúc này việc set up một môi trường development mới dùng `rake db:schema:load` thay vì `rake db:migrate` thông thường. Tham khảo thêm [tại đây](https://edgeguides.rubyonrails.org/active_record_migrations.html#schema-dumping-and-you)

## <a name="10"></a>10. Để các data nhạy cảm ở source code

Tránh để các data nhạy cảm như các key, tokens để sử dụng truy cập các dịch vụ ... chúng ta có thể để các data này ở ENV variables hoặc tốt hơn là để trong Rails credentials.

Với Rails credentials chúng ta còn có thể phân tầng data này dựa trên từng môi trường và mỗi môi trường có 1 key truy cập khác nhau. Nhờ đó mà ở môi trường `development` mọi người vẫn có thể làm việc mà không cần phải biết thông tin của môi trường `production`.
