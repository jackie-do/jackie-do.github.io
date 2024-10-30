---
title: "New features in Rails 2023 you may not know"
date: "2023-10-13T00:00:00.000Z"
description: "New features in Rails 2023 you may not know"
tags: ["rails", "ruby", "2023"]
---

```toc
# This code block gets replaced with the TOC
```

## Giới thiệu

Trong thế giới tech, mọi thứ đều được cập nhật mỗi ngày, và framework Ruby on Rails của chúng ra cũng không ngoại lệ. Bài bên dưới sẽ liệt kê ra một số features mới được thêm vào Rails năm 2023 này

## I. Các features mới

### 1. ActiveRecord Excluding

Hỗ trợ method `excluding` khi query

```ruby
## Old way
User.where.not(id: users.map(&:id))
=begin
SELECT "users".* FROM "users"
WHERE "users"."id" NOT IN (1,2)
=end

# New way
User.all.excluding(users)
=begin
SELECT "users".* FROM "users"
WHERE "users"."id" NOT IN (1,2)
=end
```

### 2. ActiveRecord Strict Loading

Bắt buộc phải load association data chứ không lazy load như default behavior

```ruby
class Project < ApplicationRecord
  has_many :comments, strict_loading: true
end

## Demo wrong usage
project = Project.first
project.comments

# ActiveRecord::StrictLoadingViolationError
# `Project` is marked as strict_loading ...

## Demo correct usage
project = Project.includes(:comments).first
```

### 3. Generated Columns

Giống như View của database nhưng nó là column, hiển thị data (được cấu trúc lại) ở column ảo, chỉ có thể xem không thể sửa trực tiếp được.

```ruby
class AddNameVirtualColumnToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :full_name, :virtual,
               type: :string,
               as: "first_name || ' ' || last_name",
               stored: true
  end
end
```

### 4. ActiveRecord attr_readonly

Thêm method `attr_readonly` để xác định những attributes chỉ được sử dụng lúc create nhưng sẽ bị ignore khi update (lưu vào DB)

```ruby
class Widget < ActiveRecord::Base
  attr_readonly :key
end

## Demo
w = Widget.create! key: 'foo'
w.update! key: 'bar'
w.key #=> 'bar'
w.reload.key #=> 'foo'
```

### 5. ActiveRecord with_options

Một cách đơn giản để tránh việc các options của associations bị duplicated

```ruby
# Old way
class Account < ActiveRecord::Base
  has_many :customers, dependent: :destroy
  has_many :products,  dependent: :destroy
  has_many :invoices,  dependent: :destroy
  has_many :expenses,  dependent: :destroy
end

# New way
class Account < ActiveRecord::Base
  with_options dependent: :destroy do
    has_many :customers
    has_many :products
    has_many :invoices
    has_many :expenses
  end
end
```

### 6. Using try instead of checking respond_to?

Sử dụng method `try` để gọi 1 public method, sẽ trả về nil nếu method không tồn tại thay vì báo exception như cách gọi thông thường
> Nhìn hiệu quả giống cú pháp `&.` của Ruby

```ruby
# Old way
method_name if respond_to?(:method_name)
(method_name if respond_to?(:method_name)) || default

# New way
try(:method_name)
try(:method_name) || default
```

## II. Các features mới của ActionText Attachable

### 1. Searching Users

```ruby
json.array! @users do |user|
  json.sgid user.attachable_sgid
  json.content render(
    partial: 'users/user',
    locals: { user: user },
    formats: [:html]
  )
end
```

Signed GlobalIDs

```ruby
User.first.attachable_sgid.to_s

# "eyJfcmFpb...."
```

### 2. Serialize Coders

```ruby
module ActionText
  class RichText < Record
    serialize :body, coder: ActionText::Content
  end
end
```
