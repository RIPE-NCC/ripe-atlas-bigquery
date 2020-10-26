## Notes on the HTTP dataset

This is the HTTP schema in our BigQuery tables. For more information on the raw data this is based upon, please also look at the [RIPE Atlas schema description](https://atlas.ripe.net/docs/data_struct/#v5000).

### Schema

```
+--------------------+-----------+---------------------------------------------------------------- +
|     field_path     | data_type | description                                                     |
+--------------------+-----------+-----------------------------------------------------------------+
| af                 | INT64     | Address Family                                                  |
| prb_id             | INT64     | RIPE Atlas probe ID                                             |
| last_time_synced   | INT64     | Discrepancy (seconds) between probe's clock and the RIPE Atlas  |
|                    |           | controller's clock. The value -1 means unknown.                 |
| msm_id             | INT64     | RIPE Atlas measurement id                                       |
| group_id           | INT64     | RIPE Atlas measurement-group id                                 |
| src_addr           | STRING    | IP Address of the interface used by RIPE Atlas probe            |
| src_addr_bytes     | BYTES     | value of the src_addr field as a bytes representation           |
| dst_addr           | STRING    | IP address of the destination of the traceroute                 |
| dst_addr_bytes     | BYTES     | value of the dst_addr fiels as a bytes representation           |
| synth_addr         | STRING    | IP address of the probe as synthesized by the RIPE Atlas        |
|                    |           | controller                                                      |
| synth_addr_bytes   | BYTES     | value of the synth_addr field as a bytes representation         |
| start_time         | TIMESTAMP | start time of the measurement                                   |
| start_hour         | INT64     | time hour of the day                                            |
| id                 | INT64     | serial number of the request/reponse cycle                      |
| proto_version      | STRING    | Protocol used for traceroute: TCP, UDP or ICMP                  |
| start_time_offset  | FLOAT64   | Duration between start of connect and data received (in         |
|                    |           | milliseconds)                                                   |
| body_size          | INT64     | size of the received body (in octets)                           |
| header_size        | INT64     | size of the received header (in octets)                         |
| dns_error          | STRING    | error description in case the DNS resolution failed             |
| error              | STRING    | the error description in case an occured error other than DNS   |
|                    |           | related                                                         |
| http_url           | STRING    | requested URL (of the target)                                   |
| http_method        | STRING    | requested HTTP verb ('GET', 'HEAD', 'POST')                     |
| http_status        | INT64     | HTTP response state                                             |
| http_duration      | FLOAT64   | Duration of the complete HTTP request/response cycle (so        |
|                    |           | excluding DNS request) (in millisconds)                         |
| time_to_connect    | FLOAT64   | HTTP response state                                             |
| time_to_first_byte | FLOAT64   | Duration of the time between connecting to and receiving bytes  |
|                    |           | from the target (in milliseconds)                               |
| time_to_resolve    | FLOAT64   | Duration of the DNS resolution process (in milliseconds)        |
+--------------------+-----------+-----------------------------------------------------------------+
```
