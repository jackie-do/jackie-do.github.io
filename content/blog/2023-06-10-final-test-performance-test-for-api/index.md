---
title: "AB Benchmarking Tool - Test performance cho API"
date: "2023-06-10T00:00:00.000Z"
description: "Test performance cho API"
tags: ["tools", "performance"]
---

```toc
# This code block gets replaced with the TOC
```

## Giới thiệu AB Benchmarking

Sao khi hoàn thành và deploy một api lên server thật thì bước kiểm thử cuối cùng thường là kiểm tra khả năng chịu tải của api này.
Chúng ta sẽ kiểm tra dựa trên một tiêu chí phổ biến là *chịu tải được bao nhiêu lượt truy cập đồng thời - concurrency*.

Trong bài này mình sẽ giới thiệu một công cụ đơn giản và rất dễ sử dụng đó là [`AB Benchmarking Tool`](https://www.tutorialspoint.com/apache_bench/apache_bench_overview.htm)

## 1. Cài đặt

Nếu bạn xài MacOS hoặc Ubuntu 22 trở lên thì AB Benchmarking thường đã được cài đặt sẵn. Nếu bạn dùng CenOS hoặc Ubuntu (Debian) thì có thể tham khảo cách cài đặt bên dưới đây:

> CenOS

```bash
yum install httpd-tools
```

> Ubuntu (Debian)

```bash
sudo apt-get install apache2-utils
```

## 2. Hướng dẫn sử dụng AB Benchmarking

Cú pháp tổng quát ta có cấu trúc bên dưới

```bash
ab [options] <IP hoặc Domain>:<port><path>
```

Trong đó **[options]** có rất nhiều sự lựa chọn. Tham khảo thêm khi bạn chạy lệnh sau: `ab -v`

```bash
Options are:
    -n requests     Number of requests to perform
    -c concurrency  Number of multiple requests to make at a time
    -t timelimit    Seconds to max. to spend on benchmarking
                    This implies -n 50000
    -s timeout      Seconds to max. wait for each response
                    Default is 30 seconds
    -b windowsize   Size of TCP send/receive buffer, in bytes
    -B address      Address to bind to when making outgoing connections
    -p postfile     File containing data to POST. Remember also to set -T
    -u putfile      File containing data to PUT. Remember also to set -T
    -T content-type Content-type header to use for POST/PUT data, eg.
                    'application/x-www-form-urlencoded'
                    Default is 'text/plain'
    -v verbosity    How much troubleshooting info to print
    -w              Print out results in HTML tables
    -i              Use HEAD instead of GET
    -x attributes   String to insert as table attributes
    -y attributes   String to insert as tr attributes
    -z attributes   String to insert as td or th attributes
    -C attribute    Add cookie, eg. 'Apache=1234'. (repeatable)
    -H attribute    Add Arbitrary header line, eg. 'Accept-Encoding: gzip'
                    Inserted after all normal header lines. (repeatable)
    -A attribute    Add Basic WWW Authentication, the attributes
                    are a colon separated username and password.
    -P attribute    Add Basic Proxy Authentication, the attributes
                    are a colon separated username and password.
    -X proxy:port   Proxyserver and port number to use
    -V              Print version number and exit
    -k              Use HTTP KeepAlive feature
    -d              Do not show percentiles served table.
    -S              Do not show confidence estimators and warnings.
    -q              Do not show progress when doing more than 150 requests
    -l              Accept variable document length (use this for dynamic pages)
    -g filename     Output collected data to gnuplot format file.
    -e filename     Output CSV file with percentages served
    -r              Don't exit on socket receive errors.
    -m method       Method name
    -h              Display usage information (this message)
    -I              Disable TLS Server Name Indication (SNI) extension
    -Z ciphersuite  Specify SSL/TLS cipher suite (See openssl ciphers)
    -f protocol     Specify SSL/TLS protocol
                    (TLS1, TLS1.1, TLS1.2 or ALL)
    -E certfile     Specify optional client certificate chain and private key
```

Nhưng ta chú ý đến những tham số cơ bản sau:

- `-n` ~ Tổng số request muốn test
- `-c` ~ Số lượng request thực hiện đồng thời trong cùng một thời điểm.

### 1. Xuất trực tiếp kết quả trên terminal

> Ví dụ:
>
> Giả sử ta muốn test mô phỏng cho **100 users** truy cập cùng một lúc để lấy Voucher trong Shopee. Vì thói quen của users là muốn có nhanh cho nên họ sẽ **refresh page** liên tục, ta cho là **50 lần**. Như vậy ta có 100 người truy cập và tổng số lượng request: `100 * 50 = 5000 requests`. Vậy ta sẽ thiết lập như sau:

```bash
# Command
ab -n 5000 -c 100 http://shopee.com/vouchers
```

```bash
# Output
Benchmarking shopee.com (be patient)
Completed 500 requests
Completed 1000 requests
Completed 1500 requests
Completed 2000 requests
Completed 2500 requests
Completed 3000 requests
Completed 3500 requests
Completed 4000 requests
Completed 4500 requests
Completed 5000 requests
Finished 5000 requests

Server Software:        SGW
Server Hostname:        shopee.com
Server Port:            80

Document Path:          /vouchers
Document Length:        164 bytes

Concurrency Level:      100
Time taken for tests:   8.399 seconds
Complete requests:      5000
Failed requests:        0
Non-2xx responses:      5000
Total transferred:      1765000 bytes
HTML transferred:       820000 bytes
Requests per second:    595.33 [#/sec] (mean)
Time per request:       167.975 [ms] (mean)
Time per request:       1.680 [ms] (mean, across all concurrent requests)
Transfer rate:          205.23 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:       48   81  23.9     73     186
Processing:    49   82  25.7     74     493
Waiting:       49   82  25.6     73     493
Total:         99  163  38.6    155     555

Percentage of the requests served within a certain time (ms)
  50%    155
  66%    173
  75%    186
  80%    193
  90%    214
  95%    235
  98%    268
  99%    289
 100%    555 (longest request)

```

Giải thích kỹ hơn một chút về các con số của output:

- **Server Software** - Phiển bản hiện thời của Web Server
- **Server Hostname** - DNS hoặc IP cung cấp cho việc đánh giá, chỉ định port trên command line
- **Server Port** - Port kết nối tới, nếu không chỉ định port trên command line, giá trị mặc định là 80 cho http hoặc 443 cho https
- **SSL/TLS Protocol** - Giao thức sử dụng mặc định giữa client và Server, sẽ chỉ xuất hiện nếu sử dụng SSL
- **Document Path**  - Request URI chỉ định Test
- **Document Length** - Độ dài của phản hồi (HTML, CSS), tính bằng byte. Nếu độ dài của phản hồi thay đổi, kết quả phản hồi được coi là lỗi
- **Concurrency Level** - Số lượng client đồng thời gửi request
- **Time taken for tests** - Tổng thời gian test, tính từ request đầu tiên tới request cuối cùng
- **Complete requests** - Số lượng Request thành công
- **Failed requests** - Số lượng Request thất bại, nếu có sẽ có mô tả về lỗi
- **Non-2xx responses** - Số lượng phản hồi không phải status code 200.
- **Total body sent** - Chỉ quan tâm khi bài test thực hiện hành động POST hoặc PUT tới server
- **Total transferred** - Tổng số byte nhận được từ server
- **HTML transferred** - Số lượng byte nhận được (Các file html), kết quả đã loại bỏ số byte trong HTTP header
- **Requests per second** - Tổng số request thực hiện trong 1s. Tính bằng tổng thời gian chia số lượng request hoàn thành (Time taken for tests / Complete requests)
- **Time per request** - Thời gian trung bình trên một request.
- **Transfer rate** - Tốc độ đường truyền (Downloading tại client). Tính bằng: 1024
- **Connection Times** - Tính bằng ms
  - **Connect và Waiting times**: Thời gian sử dụng để mở kết nối và nhận kết quả (bit đầu tiên)
  - **Processing times**: Thời gian đợi server xử lý và phản hồi
  - **Total time**: Tổng thời gian xử lý (Connect + Processsing + Waiting)

### 2. Xuất kết quả test vào file

```bash
# Command
ab -n 5000 -c 100 -g ./data.txt http://shopee.com/vouchers
```

```bash
# Output: được ghi lại vào file data.txt
starttime	seconds	ctime	dtime	ttime	wait
Sat Jun 10 16:29:51 2023	1686389391	49	52	101	52
Sat Jun 10 16:29:50 2023	1686389390	55	50	105	50
Sat Jun 10 16:29:50 2023	1686389390	55	51	106	51
Sat Jun 10 16:29:51 2023	1686389391	52	54	106	54
Sat Jun 10 16:29:50 2023	1686389390	53	54	107	53
...
```

> Lưu ý:

- **seconds**: Kiểu dữ liệu thời gian (Dạng timestamp linux, UTC)
- **ctime**: Thời gian mở kết nối (Connection Time)
- **dtime**: Thời gian xử lý (Processing Time)
- **ttime**: Tổng thời gian (Tổng = ctime + dtime )
- **wait**: Thời gian chờ (Waiting Time)