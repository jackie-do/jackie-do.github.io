---
title: Đa tác vụ trong Ruby - Gửi lời chào tới Thread, Fiber và Ractor
date: "2022-12-14T00:00:00.000Z"
description: "Cách sử lý multi-tasking trong Ruby bằng các sử dụng Thread, Fiber và Ractor"
tags: ["ruby", "ruby-3.2"]
---

```toc
# This code block gets replaced with the TOC
```

## I. Giới thiệu về đa tác vụ - đa nhiệm trong Ruby
Việc làm nhiều việc cùng lúc luôn luôn là một điều hữu ích. Trong lập trình, multitasking thường ám chỉ đến việc khi chương trình đang thực hiện task A thì thay vì phải đợi task A làm xong (ví dụ như các task gọi API, tương tác với database, IO ...) thì ta có thể chuyển qua làm task B trong khi chờ đợi task A xong. Có thể thực hiện multitask thì cũng có nghĩa computer có nhiều hơn 1 CPU, chương trình có thể chia các task vào các CPU khác nhau.

Tuy nhiên việc lập trình để làm đa tác vụ trong cùng lúc cũng khá phức tạp. Task B có thể thay đổi data, resource mà task A đang làm việc trên đó (hoặc ngược lại) dẫn đến xung đột và kết quả cuối cùng không còn chính xác. Ta nên cẩn trọng và tính toán cụ thể khi lập trình multitasking.

Khi một chương trình làm nhiều thứ cùng lúc, mỗi "thứ" khác nhau là một ***thread*** và phải đảm báo những "thread" này chạy chính xác, không ảnh hưởng đến nhau bất kể thứ tự trước sau ta gọi đó là ***thread safety***. Nếu 2 threads chạy ảnh hưởng lên nhau (ví dụ 2 threads cùng viết vào 1 text file, thread cuối cùng overwrite thread trước) đây được gọi là ***race condition*** và ta luôn tránh trường hợp này xảy ra trong multitasking.

Điều cốt yếu để đạt được ***thread safety*** là tránh việc data/state được chia sẽ giữa các threads, đặc biệt là khi data/state được thay đổi bởi một thread mà những thread khác không biết được. Trong trường hợp bắt buộc phải chia sẽ data/state thì ta nên có các biện pháp hạn chế, cấu trúc phù hợp để chỉ có 1 thread được truy cập tại một thời điểm.

Trước kia, các chương trình Ruby dùng GIL (Global Interpreter Lock), thứ này đảm bảo chỉ có 1 thread (ở cấp độ hệ điều hành, ta cần phân biệt rõ thread ở cấp hệ điều hành và thread ở cấp logic/abstraction) có để được chạy tại bất kỳ thời điểm nào, nhưng từ Ruby 3.1 có một cấu trúc mới cho phép chúng ta chạy nhiều threads (ở cấp độ hệ điều hành) gọi là **Ractors**, chúng ta sẽ tìm hiểu thêm ở phần sau.

GIL giúp Ruby đạt được một số ưu điểm:
- Thread safety - Chỉ có 1 thread hoạt động tại một thời điểm
- Khi một thread bị block thì thread khác sẽ hoạt động
Nhưng nó cũng có nhược điểm là:
- Không thể thực hiện multiple parallel CPUs với một Ruby interpreter đơn lẻ (nếu ko sử dụng **Ractor**)

==========

Trong bài hôm nay chúng ta sẽ tìm hiểu về cách Ruby Thread Abstraction (**Thread** ở cấp độ ngôn ngữ, ko phải cấp hệ điều hành) cho phép chúng ta chạy nhiều thứ khác nhau và có vẻ như chúng sẽ được chạy trong "cùng thời điểm". Ta cũng biết cách để tạo ra các process (cấp hệ điều hành).

Một loại "thread abstraction" khác nữa là **Fibers** giúp ta tạm dừng một phần chương trình để chạy phần khác của chương trình.

Cuối cùng là **Ractors** cho phép chúng ta lách qua GIL và có "multithreading thực sự" với Ruby (multitasking trên multiple CPUS).

## II. Multithreading với Thread
Level thấp nhất trong Ruby để làm hai việc cùng lúc là sử dụng **Thread** class.

Mặc dù threads có thể tận dụng multiple processors/cores (về mặt lý thuyết) trong một CPU, nhưng có một điểm cần lưu ý chính. Nhiều Ruby extension libraries không đảm bảo "thread safe", bởi vì chúng mong đợi GIL sẽ đảm nhiệm bảo đảm "thread safe" cho chúng. Vậy nên, Ruby **có** sử dụng native operating system threads (threads ở cấp hệ điều hành) nhưng chỉ vận hành 1 thread tại 1 thời điểm.

Trừ khi sử dụng Ractor library, nếu không chúng ta sẽ không bao giờ thấy 2 threads trong cùng app chạy "đồng thời thực sự". Kịch bản phổ biến nhất sẽ là 1 thread bận rộn xử lý Ruby code trong khi 1 thread khác đợi các tác vụ I/O.

### 1. Tạo và tương tác với thread
#### a. Tạo thread

Dưới đây là một ví dụ đơn giản về việc download các trang webs một cách song song (parallel). Việc download mỗi trang web sẽ được 1 thread riêng lo liệu.

> Code:
```ruby
require "net/http"
pages = %w[www.rubycentral.org www.pragprog.com www.google.com]
threads = pages.map do |page_to_fetch|
  Thread.new(page_to_fetch) do |url|
    http = Net::HTTP.new(url, 80)
    print "Fetching: #{url}\n"
    response = http.get("/")
    print "Got #{url}: #{response.message}\n"
  end
end
threads.each { |thread| thread.join }
print "We're done here!"
```

> Output:
```
Fetching: www.rubycentral.org
Fetching: www.pragprog.com
Fetching: www.google.com
Got www.google.com: OK
Got www.pragprog.com: Moved Permanently
Got www.rubycentral.org: OK
We're done here
```

Như các bạn thấy các new threads được tạo bằng cách gọi `Thread.new`.

`Thread.new` sẽ nhận 1 **block** chứa code để được chạy trong thread mới. Trong ví dụ trên thì block sử dụng thư viện net/http để fetch trang web dựa trên URL được pass vào thread.

Một khi thread được tạo, nó sẽ được xếp lịch để thực thi bởi hệ điều hành, và trong ví dụ này, chúng ta không có quyền kiểm soát khi nào thread sẽ chạy.

Trong đoạn code này, chúng ta sử dụng `map` để tạo 3 threads mới và lưu vào một array. `Threads`, như mọi thứ khác trong Ruby đều là objects vậy nên ta có thể assign vào variable, return từ block/method và truyền như một parameter.

Bây giờ hãy nhìn kỹ hơn cách các threads hoạt động:
- Chúng ta fetch 3 trang web bằng 3 threads khác nhau, nhìn kỹ output ta sẽ thấy 3 "Fetch" sẽ chạy trước bất cứ "Got" nào. Tại sao 3 "Fetch" lại được in ra trước sẽ được giải thích ở bên dưới.
- ở chương trình chính khi thread đầu tiên được tạo ra, được lên lịch để thực thi, khi thực thi nó sẽ gọi HTTP request và bị block trong khi chờ response khi gọi HTTP request -> khi bị xác nhận là block (hệ điều hành/GIL tự xác định) thì sẽ quay lại chương trình chính và ngay lập tực tạo tiếp thread mới và cứ tiếp tục.
- Việc tạo ra thread sẽ nhanh hơn rất rất nhiều so với việc đợi response từ một HTTP request nên dẫn đến cả 3 threads này được tạo xong thì thread đầu tiên được tạo vẫn chưa nhận được response => 3 "Fetch" được in ra trước 3 "Got"

Trong ví dụ code trên chúng ta tạo thread và truyền URL như là một parameter vào block, tại sao chúng ta lại truyền URL vào trong khi chúng ta đã có biến `page_to_fetch` ở bên ngoài block ? Câu trả lời liên quan tới "thread safety" và cách các threads chia sẽ values.

Một thread chia sẽ tất cả global/instance/local variables đã tồn tại và available tại thời điểm thread được tạo. Nhưng việc chia sẽ không phải lúc nào cũng tốt. Trong ví dụ của chúng ta, `page_to_fetch` variable được chia sẽ tới 3 threads
- Đối với thread đầu, ban đầu `page_to_fetch` sẽ bằng "www.rubycentral.org" nhưng vòng loop vấn tiếp tục chạy
- Ở loop thứ 2 `page_to_fetch` được cập nhật thành "pragprog.com", lúc này có thể thread đầu vẫn chưa hoàn tất việc sử dụng biến `page_to_fetch` và nếu nó sử dụng thì nó sẽ sử dụng giá trị mới. Những lỗi kiểu này bắt buộc phải tránh vì rất khó để tìm ra.
- Vậy nên việc sử dụng local variables được tạo ở mỗi thread sẽ đảm bảo "thread safety" hơn, bằng cách pass value trực vào block và sử dụng để tạo biến local ở mỗi thread.

#### b. Tương tác với Thread
Thông thường khi một Ruby program bị terminate (process tương ứng bị terminate), tất cả các threads đều bị kill, bất kể state của các threads này là gì. Nếu chúng ta không có logic để handle phần này thì dễ có tình trạng khi Ruby program kết thúc khi 1 hoặc nhiều threads vẫn còn đang xử lý và phần xử lý này sẽ không bao giờ hoàn tất.

Tất nhiên cũng ta có thể đợi 1 Ruby thread nào đó cho đến khi nó hoàn thành xử lý bằng cách gọi method `join`. Thread nơi gọi method `join` cho các thread khác, trong ví dụ trên là main thread (chương trình ban đầu chạy) sẽ bị block cho tới nhận được tín hiệu hoàn thành từ các thread kia.

Bằng cách gọi `join` trên mỗi sub thread ta sẽ đảm bảo được các sub thread sẽ hoàn thành rồi mới terminate chương trình chính chạy bởi main thread.

Một vài method quen thuộc khác khi làm việc với thread là sẽ được liệt kê dưới đây:
- `Thread.current` - truy cập tới thread hiện tại đang thực thi logic
- `Thread.list` - trả về danh sách các threads objects có thể chạy hoặc bị đã bị dừng.
- Sử dụng `exit` hoặc `kill` để dừng và terminate một thread ( `thread.kill()` )
- Check `status` hoặc `alive?` để kiểm tra trạng thái của một Ruby thread
  - status **run** - Thread đang được thực thi bình thường
  - status **sleep** - Thread đang bị tạm dừng hoặc blocked
  - status **aborting** - Thread đang bị kill
  - nếu thread kết thúc bình thường sẽ trả về **false**, nếu bị terminate mà không lường trước được thì sẽ trả về **nil**.
  - `alive?` trả về true nếu status là **run** hoặc **sleep**
- Ta cũng có thể đặt ưu tiên cho một thread bằng cách set priority dùng method `priority=`, priority cao sẽ được ưu tiên chạy trước (lưu ý OS có thể phớt lờ setting này =))

### 2. Sử dụng variables trong thread
Một thread có thể thoải mái sử dụng tất các các biến "trong scope nơi thread được tạo". Những biến được tạo trong thread block code là những local variables của thread đó (thread-local variable) và sẽ không chia sẽ cho các các thread khác.

Nhưng nếu ta muốn chia sẽ local variable của một thread cho các thread khác thì sao? class `Thread` có một công cụ cho phép các thread-local variables được tạo và truy cập bằng tên.

Hãy xem 1 thread object là một Hash, chúng ta sẽ gán biến cho một thread bằng `[]=` và truy cập bằng `[]`. Ngoài ra ra có thể get và set các thread-local variable bằng method `Thread.thread_variable_get` và `Thread.thread_variable_set`.

Để có một cái nhìn cụ thể hơn ta hãy xem qua ví dụ bên dưới

> Code:
```ruby
count = 0
threads = 10.times.map do |i|
  Thread.new do
    sleep(rand(0.1))
    Thread.current[:my_count] = count # gán biến my_count cho thread đang làm việc
    count += 1
  end
end

threads.each do |t|
  t.join
  print t[:my_count], ","  # In ra gía trị của biến my_count của thread đang làm việc
end

puts "count = #{count}"
```

> Output:
```
8, 5, 7 , 1, 4, 9, 0, 3 , 6, 2, count = 10
```

Ở ví dụ này có tồn tại `race condition`, đó là biến count có thể được cập nhật bởi bất kỳ thread nào. Do đó sẽ có trường hợp 2 hoặc nhiều thread hơn cập nhật giá trị tại 1 thời điểm dẫn tới kết quả không chính xác.

`race condition` này có để được fix bằng cách synchronization thông qua Mutual Exclusion ở phần **4. Kiểm soát thread**

### 3. Exception trong thread
Nếu một thread raise một exception không biết trước (không có logic handle exception này), thì việc xảy ra tiếp theo phụ thuộc vào setting của `Thread.abort_on_exception` flag và setting của interpreter `$DEBUG` flag.

Nếu `abort_on_exception` là **false** và debug flag chưa được bật (default setting), một exception sẽ đơn giản là kill thread xảy ra exception - các phần khác vẫn chạy bình thường. Thực sự thì chúng ta sẽ không bao giờ nhận một thread exception trừ khi chúng ta dùng `join` cho thread đó. Hãy xem ví vụ này bên dưới

> Code: Ví dụ raise exception không dùng join
```ruby
threads = 4.times.map do |number|
  Thread.new(number) do |i|
    raise "Boom!" if i == 1

    p "#{i}"
  end
end

pust "Waiting"
sleep 0.1
puts "Done"
```

> Output:
```
#<Thread:0x00000010d6330 prog.rb:2 run> terminated with exception
(report_on_exception is true)
prog.rb:3:in `block (2 levels) in <main>`: Boom! (RuntimeError)
Waiting
0
2
3
Done
```


Thông thường chúng ta không sleep main thread để chờ các threads terminate mà chúng ta gọi join cho các threads này. If sử dụng join cho cho một thread raise exception thì exception đó sẽ được raise ở chính main thread thực hiện việc joining. Ví dụ sẽ được cập nhật một chút

> Code: Ví dụ raise exception có dùng join
```ruby
threads = 4.times.map do |number|
  Thread.new(number) do |i|
    raise "Boom!" if i == 1
    print "#{i}\n"
  end
end

puts "Waiting"
threads.each do |t|
  begin
    t.join
  rescue RuntimeError => e
    puts "Failed: #{e.message}"
  end
end
puts "Done"
```

> Output
```
#<Thread:0x0000000104591d48 prog.rb:2 run> terminated with exception
(report_on_exception is true):
prog.rb:3:in `block (2 levels) in <main>': Boom! (RuntimeError)
Waiting
0
Failed: Boom!
2
3
Done
```

**Lưu ý** nếu chúng ra set `abort_on_exception` là true hoặc sử dụng -d để bật Debug flag thì một exception trong thread sẽ kill main thread và message "Done" sẽ không bao giờ hiện ra.

```ruby
Thread.abort_on_exception = true
# ... the rest code
```

### 4. Kiểm soát thread
Thông thường, tốt nhất là cứ để thread tự làm việc, việc lên lịch sắp xếp khi nào thread làm việc được thực thi tự động bới `Thread Scheduler`.
Tuy nhiên ta vẫn được cung cấp một số method để kiểm soát hoặc dẫn đường cho Thread Scheduler như:
- `stop` - Dừng current thread
- `run` - chạy 1 thread nào đó
- `pass` - đưa current thread khỏi schedule để cho thread khác chạy
- `join` và `value` - đây là 2 methods được sử dụng phổ biến và nó có tác dụng ở cho low-level thread (cấp hệ điều hành), sẽ dừng thread gọi cho tới khi các threads được gọi hoàn thành.

Ngoài việc tương các ở mức độ low-level thread thì ta vẫn có thể thể tương tác ở mức độ higher-level thread. Hãy đi tới ví dụ bên dưới.

> Ví dụ 1: demo về race condition, cập nhật chung trên 1 biến

```ruby
sum = 0
threads = 10.times.map do
  Thread.new do
    100_000.times do
      new_value = sum + 1
      puts "#{new_value}" if new_value % 200_000 == 0
      sum = new_value
    end
  end
end

threads.each(&:join)
puts "\n sum = #{sum}"
```

> Output
```bash
200000
400000
600000
800000
800000
sum = 899999
```


Ở ví dụ này ta có 10 threads, mỗi thread sẽ cộng dồn vào `sum` giá trị 100,000. Khi các threads hoàn thành nếu giá trị sum cuối cùng có giá trị dưới 1,000,000 nghĩa là có race condition xảy ra (sẽ xảy ra khi 1 thread ghi đè giá trị lên sum khi 1 thread đang chờ print - print là IO action)

Ta có thể tránh race condition ở ví dụ trên dễ dàng bằng cách sử dụng built-in class `Mutex` (viết tắt của "mutually exclusive") để tạo 1 synced region - nơi mà đoạn code ở vùng này chỉ có thể được chạy bởi 1 thread tại 1 thời điểm. Nó giống như 1 toalet công cộng, mọi người đều có thể sử dụng, đôi khi ta phải xếp hàng chờ, nhưng tại một thời điểm luôn toalet sẽ bị khóa để chỉ có một người có thể sử dụng :)

> Ví dụ 2: cập nhật áp dụng Mutex: lock - do something - unlock
```ruby
sum = 0
mutex = Thread::Mutex.new
threads = 10.times.map do
  Thread.new do
    100_000.times do
      mutex.lock               ## Tại một thời điểm thì khóa lại cho 1 thread sử dụng
      new_value = sum + 1      #
      puts "#{new_value}" if new_value % 200_000 == 0
      sum = new_value          #
      mutex.unlock             ##
    end
  end
end
threads.each(&:join)
puts "\nsum = #{sum}"
```

> Output
```bash
200000
400000
600000
800000
1000000
sum = 1000000
```

Với pattern lock - do something - unlock, ta có thể dùng một method cung cấp sẵn của `Mutex` là `synchronize`, method này còn đảm bảo mutex sẽ được unlocked nếu exception xảy ra. Nếu viết thủ công và không handle kỹ thì có thể khi exception xảy ra thì mutex sẽ không bao giờ được unlocked và các threads khác sẽ không bao giờ sử dụng được.

> Ví dụ 3: cập nhật dùng Mutex.synchronize
```ruby
sum = 0
mutex = Thread::Mutex.new
threads = 10.times.map do
  Thread.new do
    100_000.times do
      mutex.synchronize do       ## Tại một thời điểm thì khóa lại cho 1 thread sử dụng
        new_value = sum + 1      #
        puts "#{new_value}" if new_value % 250_000 == 0
        sum = new_value          #
      end                        #
    end
  end
end
threads.each(&:join)
puts "\nsum = #{sum}"
```

> Output
```bash
250000
500000
750000
1000000
sum = 1000000
```

===

Chúng ta đã hiểu cách sử dụng Mutex ở các trường hợp đơn giản thông qua các ví dụ trên.
Ngoài ra chúng ta còn có thể sử dụng một số method phổ biến khác như `try_lock`, method này sẽ thử lock mutex nếu có thể trả về **true**, nếu ko lock được sẽ trả về **false**. Chúng ta sẽ đi qua thêm một ví dụ cho method này.

> Ví dụ sử dụng `try_lock`
```ruby
rate_mutex = Thread::Mutex.new
exchange_rates = ExchangeRates.new
exchange_rates.update_from_online_feed

Thread.new do
  loop do
    sleep 3600                                    # Cứ mỗi 1h thì thức dậy, lock lại và cập nhật exchange rate
    rate_mutex.synchronize do                     #
      exchange_rates.update_from_online_feed      #
    end                                           #
  end
end

loop do
  puts "Enter currency code and amount:"
  line = gets

  if rate_mutex.try_lock                                              # Cố gắng thử lock để lấy quyền sử dụng exchange rate
    puts(exchange_rates.convert(line)) ensure rate_mutex.unlock       # Hiển thị rate, nếu có exception thì đảm bảo unlock
  else
    puts "Sorry, rates being updated. Try again in a minute"
  end
end
```

Trong trường hợp chúng ta đang giữ một lock của một mutex mà muốn unlock tạm thời (trong một khoảng thời gian) để cho phép những threads khác sử dụng, có có thể sử dụng `Mutex#sleep`

> Ví dụ sử dụng `sleep`
```ruby
rate_mutex = Thread::Mutex.new
exchange_rates = ExchangeRates.new
exchange_rates.update_from_online_feed

Thread.new do
  rate_mutex.lock
  loop do
    rate_mutex.sleep(3600)                                           # Tạm thời unlock resource trong 3600s sau đó sẽ lock lại
    exchange_rates.update_from_online_feed
  end
end

loop do
  puts "Enter currency code and amount:"
  line = gets

  if rate_mutex.try_lock                                             # Cố gắng thử lock để lấy quyền sử dụng exchange rate
    puts(exchange_rates.convert(line)) ensure rate_mutex.unlock      # Hiển thị rate, nếu có exception thì đảm bảo unlock
  else
    puts "Sorry, rates being updated. Try again in a minute"
  end
end
```

## III. Làm việc ở cấp độ Process
Đôi khi chúng ta cần chia task ra và thực hiện ở một vài process khác nhau để có thể tận dụng ưu điểm của multiple cores/cpus hoặc chạy 1 process riêng ko được viết bằng Ruby (C++, Golang ...)

Ruby vẫn hỗ trợ cũng ta một số methods để sinh ra và quản lý các processes khác từ process chính.

### 1. Sinh ra một process mới
### 2. Process con chạy độc lập
### 3. Block code và Subprocesses


## IV. Fiber là một lightweight thread?
Cái tên Fiber khiến mọi người có thể nhầm lẫn và xem nó như 1 loại "lightweight-thread" của Ruby, nhưng bản chất Ruby Fiber là một code block chứ không phải một thread, điều đặc biệt là "block of code" này có thể stop và restart có thể xem nó là **coroutine**.

Fibers trong Ruby được sử dụng cho "cooperatively multitasking", mỗi fiber sẽ giải quyết một phần công việc bằng cách phối hợp, tương tác với fibers hoặc code khác, khác với thread thường ưu tiên để làm các công việc song song ko ràng buộc nhau, một điều khác biệt rõ ràng nữa của Fiber so với Thread là chính chúng ra phải control việc chạy các fibers này thay vì để OS (hệ điều hành quyết định) như thread.

**Fiber không chạy ngay lập tức khi được tạo, sẽ hoạt động kiểu dừng - chạy - dừng**

> Ví dụ: Đếm số lần xuất hiện của các từ
```ruby
counts = Hash.new(0)
File.foreach("./testfile") do |line|
  line.scan(/\w+/) do |word|
    word = word.downcase
    counts[word] += 1
  end
end
counts.keys.sort.each { |k| print "#{k}:#{counts[k]} " }
```

> Output
```
is:3 line:3 on:1 one:1 so:1 this:3 three:1 two:1
```

Ví dụ ở trên vẫn chạy ổn, chỉ có điều là logic tìm word và logic đếm word trộn lẫn với nhau. Ví dụ dưới đây sử dụng Fiber để tách biệt logic


> Ví dụ: Đếm số lần xuất hiện của các từ dùng Fiber
```ruby
words = Fiber.new do                      #
  File.foreach("./testfile") do |line|    #
    line.scan(/\w+/) do |word|            #
      Fiber.yield word.downcase           # Dừng chạy code cho tới khi resume được gọi, khi resume gọi sẽ nhận về giá trị được passed
    end                                   # trong Fiber.yield
  end                                     #
  nil                                     #
end

counts = Hash.new(0)
while (word = words.resume)             # Gọi lần đầu sẽ chạy code trong fiber cho tới khi gặp Fiber.yield và nhận giá trị được passed
  counts[word] += 1                     # trong Fiber.yield, các lần sau sẽ tiếp tục như vậy
end

counts.keys.sort.each { |k| print "#{k}:#{counts[k]} " }
```

Cấu trúc của Fiber là sẽ nhận 1 code block và trả về 1 fiber object. Không giống thread, code trong block của một fiber không chạy một lèo ngay lập tức. Sau khi một fiber được tạo, chúng ta có thể gọi `resume` trên fiber object đó. Gọi `resume` lần đầu thì block code trong fiber mới được thực khi.

Ở ví dụ trên,
- File *testfile* được open và chúng ta bắt đầu scan để lấy ra từng từ đơn lẻ và pass vào scan block.
- Trong block này, `Fiber.yield` được gọi, việc gọi `Fiber.yield` sẽ dừng việc thực thi code trong fiber tới khi `resume` được gọi
- Khi ta gọi `resume` từ fiber object, sẽ nhận về  giá trị được passed vào trong Fiber.yield và code tiếp tục chạy tới khi gặp Fiber.yield
- Cứ tiếp tục như vậy cho tới khi chạy hết logic trong fiber và vòng loop kết thúc.


> Ví dụ: Tạo số tuần tự chẵn vô tận, không chia hết cho 3
```ruby
sequence_number = Fiber.new do
  num = 2
  loop do
    Fiber.yield(num) unless num % 3 == 0
    num += 2
  end
end

10.times { puts sequence_number.resume }
```
===

Fibers chỉ là các objects, chúng ta có thể pass hoặc store như các biến nhưng lưu ý là Fiber chỉ có thể được `resume` trong chính thread tạo ra nó.
Chúng ta có thể sử dụng `transfer` thay thế cho bộ đôi `yield/resume`, nhưng sẽ phức tạp hơn.
Ngoài ra thì còn có non-blocking fibers, các fibers sẽ được quản lý bởi fiber scheduler.

## V. Hiểu về Ractor
Rator vẫn chỉ là bản thử nghiệm (tính tới Ruby 3.2), chưa phải là chức năng chính thức.

Ractor cho phép chạy **true parallelism** trong một Ruby interpreter đơn: mỗi Ractor có một GIL riêng biệt, để xử lý concurrent tốt hơn.
### 1. Cách Ractor hoạt động
Ractors cho phép **true parallelism** trong một Ruby interpreter tách biệt: mỗi Ractor duy trì một GIL riêng, để đảm bảo performance tốt hơn. Để đảm bảo điều này thì việc truy cập các variables các biến bên ngoài scope của ractor bị giới hạn và việc giao tiếp giữa các ractors cũng chỉ được thực việc với một vài cách hạn chế.

Bạn có thể hiểu 1 ractor sẽ là 1 căn phòng (chứa code) với duy nhất 1 cửa vào "entrance" và 1 cửa ra "exit". Và chúng ta có thể phải xếp hàng ở cửa vào trong một số trường hợp.

Tạo ra một ractor bằng `Ractor.new`, sẽ luôn luôn nhận 1 block code, đây sẽ là đoạn code nằm trong căn phòng của chúng ta. Ngoài ra thì `Ractor.new` còn nhận thêm một vài tham số khác, nhưng `name` - unique name của Ractor.

Một khi một ractor được tạo ra, thread tạo ra ractor đó sẽ được gọi là `main` ractor và có thể được truy cập thông qua `Ractor.main`

Các Ractors tương tác nhau bằng 1 trong 4 cách sau:
- Một Ractor (bao gồm main thread) có thể gửi các arguments tới 1 Ractor được biết trước đó (thông qua unique name ...) Nói một cách ẩn dụ, thì tương ứng với việc yêu cầu ai đó đứng trước hàng chờ của một cửa vào "entrance" của một căn phòng khác. Có một điều cần lưu ý là hàng chờ này là vô hạn (ko có giới hạn con số) và sau khi gửi thì ta *không bị blocked để chờ phản hồi*. Chúng ta dùng API `send` để gửi message từ một ractor đến một ractor khác.
- Một Ractor (hoặc main thread) có thể nhận output từ một Ractor được biết trước đó. Nói một cách ẩn dụng, chúng ta lần này sẽ đợi ở cửa ra "exit" để chờ lấy món đồ tiếp theo xuất hiện và lấy nó đi. Dùng API `take` để một ractor chờ nhận giá trị trả về của một ractor khác (api này sẽ block waiting)
- Bên trong một ractor, ractor có thể block waiting để chờ nhận một message sắp tới. Hiểu ẩn dụ là ta sẽ chờ ai đó xuất hiện và gõ cửa vào "entrance". Ta dùng API `Ractor.receive` - Class method, để chờ message ở cửa vào (api này sẽ block waiting)
- Trường hợp cuối cùng là bên trong một ractor, có thể block waiting chờ yêu cầu của một ractor khác. Chờ ai đó gõ cửa "Exit" để yêu cần nhận đồ. Ta dùng API `Ractor.yield(obj)`, argument truyền vào là món đồ/message được gửi đi.

Vòng đời của một ractor như sau:
- Đầu tiên, ractor được tạo bằng cách sử dụng `Ractor.new`. Code block de được truyền vào start ngay lập tức, các arguments được passed tới `new` sẽ được pass tới tới block code.
- Ractor được tạo ra thì *biệt lập hoàn toàn - isolated*, nghĩa là nó không thể truy cập được bất cứ thứ gì không được định nghĩa bên trong code block, không có globals, không có external locals. Chỉ có duy nhất 1 các để đưa value vào một ractor là thông qua method `send`
- Code block đưa vào ractor sẽ thực thi cho đến khi:
  - Code block gặp `Ractor.yield` call, trường hợp này nó sẽ đợi một ractor khác gọi `take`, khi ractor khác gọi `take` thì ngay lập tức sẽ pass argument trong `yield()` và tiếp tục chạy tiếp.
  - Code block gặp `Ractor.receive` call, nó sẽ đợi cho một ractor khác gọi `send`, arguments được gửi bởi `send` là giá trị trả về của `Ractor.receive`
  - Code block kết thúc. Giá trị của expression cuối cùng sẽ gửi cho ractor nào dùng `take` để nhận.

Tiếp theo hãy quay lại bằng toán đếm từ

> Ví dụ: Đếm từ bằng Ractor
```ruby
reader = Ractor.new(name: "reader") do
  File.foreach("testfile") do |line|
    line.scan(/\w+/) do |word|
      Ractor.yield(word.downcase)
    end
  end

  nil # Giá trị expression cuối cùng của code block
end

counter = Ractor.new(reader, name: "counter") do |source|
  result = Hash.new(0)
  while(word = source.take)
    result[word] +=1
  end
  result
end

counts = counter.take
counts.keys.sort.each { |word| p "#{word}:#{counts[k]}"}
```
### 2. Truyền Variable vào Ractor






