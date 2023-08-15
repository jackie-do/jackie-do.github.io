---
title: Sử dụng gem Interactor để xây dựng các actions có tính tái sử dụng cao
date: "2022-12-06T00:00:00.000Z"
description: "Xây dựng các action hoặc flow of actions có tính tái sử dụng cao"
tags: ["rails", "ruby", "design pattern"]
---
> - [I. Giới thiệu về gem Interactor](#1_intro)
> - [II. Áp dụng vào Rails](#2_apply)
> - [III. Quy định một cấu trúc cho business logics](#3_structure)
> - [IV. Giải thích thêm về gem Interactor](#4_explain)
> - [V. Ví dụ](#5_coding_example)

## <a name="1_intro"></a>I. Giới thiệu về gem Interactor
Gem [Interactor](https://github.com/collectiveidea/interactor) sẽ là nhân vật chính của chúng ta ngày hôm nay.
Việc sử dụng Design Pattern là một việc rất phổ biến trong lập trình OOP nói riêng và lập trình nói chung. Và việc module hóa cộng với việc tái sử dụng là một trong các mục tiêu mà chúng ta thường hướng tới trong lập trình.

Trong bài này chúng ta sẽ module hóa các business logic trong Rails nhằm tăng khả năng tái sử dụng thông qua việc dùng gem `Interactor`

## <a name="2_apply"></a>II. Áp dụng vào Rails
Cấu trúc thường thấy ở Rails là MVC (Model - View - Controller), ở mô hình này ta thường đặt các business logic ở trong Model, khi business logic ở Model trở nên phức tạp và phình to ra thì ta tái cấu trúc và chuyển các business logics này qua các module khác như `Services`, `Decorators` ...

Việc đặt các logic/code gì ở thư mục Services/Decorators ... được quy định và thống nhất ở các thành viên trong team. Trong bài post này, chúng ta sẽ đặt các business logics vào trong thư mục `Interactors`

## <a name="3_structure"></a>III. Quy định cấu trúc cho business logics
Dưới đây là cấu trúc tổng quan trong thư mục `interactor`

```
app
│
│
└─── interactors
|   |
|   └─── <business module 1>
|   |   |
|   |   └─── actions
|   |   |
|   |   └─── flows
|   |
|   └─── <business module 2>
|       |
|       └─── actions
|       |
|       └─── flows
|
|
```

  - Mỗi **Business Module** đại diện cho 1 nhóm các business logic có liên quan với nhau như:
    - `UsersBusiness`: gồm các hành động liên quan tới User như tạo User, cập nhật thông tin User ...
    - `NotificationsBusiness`: thông báo qua email, thông báo qua tin nhắn ...
  - Mỗi **Action** là 1 action riêng lẻ cho 1 business action cố định, một action phải duy nhất và độc lập: tạo User, cập nhật User ...
  - Mỗi **Flow** là sự kết hợp từ 2 actions trở lên để phục vụ cho 1 mục đích cụ thể.

Ví dụ:
```
app
│
│
└─── interactors
|   |
|   └─── users_business
|   |   |
|   |   └─── actions
|   |   |   |
|   |   |   └─── create_user.rb
|   |   |   |
|   |   |   └─── update_user.rb
|   |   |   |
|   |   |   └─── delete_user.rb
|   |   |
|   |   └─── flows
|   |       |
|   |       └─── create_user_and_notify.rb
|   |
|   └─── notify_business
|       |
|       └─── actions
|           |
|           └─── notify_new_user_via_email.rb
|           |
|           └─── notify_via_sms.rb
|
|
```

## <a name="4_explain"></a>IV. Giải thích thêm về gem Interactor
Vui lòng đọc document của gem [https://github.com/collectiveidea/interactor](https://github.com/collectiveidea/interactor) để nắm bắt các ý tưởng chính như:
  - context: chứa đựng tất các input, output, state của interactor
  - failure: cách để raise failure trong một interactor
  - hooks: các callbacks/hooks
  - interactor: là thành phần cơ bản và quan trọng nhất, mỗi interactor thực hiện chỉ 1 mục đích và ko phụ thuộc vào bất kỳ interactor nào khác.
  - organizer: kết hợp nhiều interactor làm việc cùng nhau.

## <a name="5_coding_example"></a>V. Ví dụ code
Code cho cấu trúc ở trên: tạo một user và notify qua email

#### 0. Cài đặt gem vào Rails
> Cài đặt vào Gemfile và bundle
```
gem 'interactor'
```
#### 1. Ở Controller
###### a) Set up để bắt exception từ controller
> Tạo exception mới
```ruby
# app/exceptions/business_failed_error.rb
class BusinessFailedError < StandardError
  attr_reader :error_details

  def initialize(result = nil, msg = '')
    @error_details = result.error_details
    super(msg)
  end
end
```

> Tạo concern để bắt exception
```ruby
# app/controllers/concerns/api/catch_controller_errors.rb
module Api::CatchControllerErrors
  extend ActiveSupport::Concern

  included do
    rescue_from BusinessFailedError, with: :handle_business_errors
  end

  def handle_business_errors(exception)
    errors = exception.error_details

    render json: { errors: errors }, status: :bad_request
  end
end
```
> Chúng ta có thể gắn concern vừa tạo ở trên vào BaseController hoặc bất cứ controller nào mà ta muốn

###### b) Tạo một action endpoint để tạo user ở Controller
```ruby
module V1::API
  class UsersController
    include Api::CatchControllerErrors

    def create
      ApplicationRecord.transaction do
        @result = UsersBusiness::Flows::CreateUserAndNotify.call(
          user_params: params.to_unsafe_hash
        )

        raise BusinessFailedError.new(@result) unless @result.success?
      end

      render json: @result.user.to_json, status: :ok
    end
  end
end
```
> **Lưu ý**: Ta có thể thấy trong `create` action ở trên ta bọc Flow CreateUserAndNotify trong 1 transaction, đây là best practice, ta chỉ nên bọc transaction bên ngoài chứ ko nên sử dụng bên trong các interactor để tránh các nested commits ngoài ý muốn.

### 2. Ở Interactors
###### a) Tạo action ở Users business
> Implement action để tạo user
```ruby
module UsersBusiness
  module Actions
    class CreateUser
      include Interactor

      # required params
      # - user_params - a hash of user info
      #
      # output params
      # - user - a User instance of the newly created user
      def call
        context.user = create_user!(user_params)
      end

      private

      def create_user!(validated_user_params)
        User.create!(validated_user_params)
      rescue StandardError => e
        context.fail!(error_details: e.messages )
      end
    end
  end
end
```

###### b) Tạo action ở Notifications business
> Implement action để tạo user
```ruby
module NotificationsBusiness
  module Actions
    class NotifyNewUserViaEmail
      include Interactor

      # required params
      # - email - an email of a newly created user
      def call
        notify_new_user_via_email
      end

      private

      def email_params
        {
          to: context.email
        }
      end

      def notify_new_user_via_email
        UserMailer.notify_newly_created_user(email_params).deliver
      end
    end
  end
end
```

###### c) Tạo flow kết hợp 2 actions ở Users business
> Implement flow để tạo user và notify user
```ruby
module UsersBusiness
  module Flow
    class CreateUserAndNotify
      include Interactor::Organizer

      organize UsersBusiness::Actions::CreateUser,
               NotificationsBusiness::Actions::NotifyNewUserViaEmail
    end
  end
end
```