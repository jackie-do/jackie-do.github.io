---
title: "Query Objects In Rails"
date: "2023-09-05T00:00:00.000Z"
description: "Using query object design pattern in Rails"
tags: ["rails", "ruby", "design pattern"]
---

```toc
# This code block gets replaced with the TOC
```

## Giới thiệu

Trong bài post hôm nay chúng ta sẽ làm quen với cách sử dụng `Query Object` pattern trong Rails.
`Query Object` thường được sử dụng để đóng gói các logic cho việc query database, việc sử dụng pattern này sẽ khiến tăng khả năng tái sử dung (reusable), có khả năng kết hợp với các query objects khác (composable), và chuẩn hóa được các parameters đầu vào (parameterizable unit)

## I. Sử dụng query filters với ActiveRecord thông thường

### 1. Sử dụng thông thường

Trong Rails, với sự giúp đỡ của ActiveRecord model ta có thể dễ dàng sử dụng các built-in methods để tạo các database queries dễ dàng như

> Ví dụ 1: Query thông thường

```ruby
Company
  .joins(:contracts)
  .where(province: "Ho Chi Minh")
  .where(contracts: { size_level: "Big"})
```

Nếu chúng ta sử dụng câu query ở trên khắp nơi trong app của chúng ta, khi chúng ta cần sửa đổi province hay level thì chúng ta phải cập nhật tất cả mọi nơi, như vậy sẽ rất tốn thời gian.
Cách fix đơn giản nhất là sử dụng các class methods cho việc tái sử dụng và nhận các tham số

> Ví dụ 2: Refactor để có các class methods hỗ trợ

```ruby
# Cập nhật trong model
class Company < ApplicationRecord
  def self.by_province(province)
    where(province: province)
  end

  def self.by_size_level(size_level)
    joins(:contracts)
      .where(contracts: { size_level: size_level })
  end

  # ...
end

# Khi sử dụng
Company
  .by_province("Ho Chi Minh")
  .by_size_level("Big")
```

### 2. Khi các query filters là optional

Khi các query filters là optional thì ta phải cập nhật code lại

> Ví dụ 3: giả sử filter `by_province` là optional

```ruby
  def self.by_province(province)
    where(province: province) if province.present?
  end
```

Nếu chúng ta cập nhật code như ví dụ 3 thì các filters của chúng ta không thể "chain" được (không thể gọi nối tiếp nhau vì method trả về nil nếu province không tồn tại).
Vấn đề này sẽ tự động được giải quyết nếu chúng ta sử dụng built-in method `scope` của ActiveRecord. Khi một scope trả về nil thì nó tự động chuyển đổi thành 1 giá trị khác để đảm bảo khả năng chainability của các scope.

> Ví dụ 4: Sử dụng scope thay vì class method

```ruby
class Company < ApplicationRecord
  scope :by_province, -> (province) { where(province: province) if province.present? }
  scope :by_size_level, -> (size_level) {
    if size_level.present?
      joins(:contracts).where(contracts: { size_level: size_level })
    end

  }
  # ...
end

```

## II. Sử dụng query objects cho các domain-specific queries

Code của chúng ta đã cải thiện phần nào kể từ ví dụ đầu tiên, nhưng kết quẻ cuối cùng vẫn còn vài chỗ  "bốc mùi" (smells).

- Bởi vì toàn bộ là chainable queries nên chúng thường được sử dụng cùng nhau. It’s a chainable query, so it’s very likely that our filters will always be used together; we want to make sure our filters are tested in the same combinations they will actually be used in production, but no proper encapsulation exists;

- Our filters are optional; the logic to skip a filter is very specific and may not make sense in the general context of our ServiceOffering model. If we reuse a scope like that, we may inadvertently introduce a bug in our application if we’re not counting with the possibility of blank filters;

- We are joining with other tables, which feels outside of our model’s responsibility; whenever our query spans more than one table or reaches a certain complexity threshold, it’s a sign we could represent it with a query object.

--- WIP ---

