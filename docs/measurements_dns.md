## Notes on the DNS dataset

### Schema

This is the DNS schema in our BigQuery tables. For more information on the raw data this is based upon, please also look at the [RIPE Atlas schema description](https://atlas.ripe.net/docs/data_struct/#v5000).

```
+--------------------+------------------------+-----------------------------------------------------------------------+
|    column_name     | data_type              | description                                                           |
+--------------------+------------------------+-----------------------------------------------------------------------+
| af                 | INT64                  | Address Family                                                        |
| protoc             | STRING                 | Protocol used for DNS request                                         |
| prb_id             | INT64                  | RIPE Atlas probe ID                                                   |
| last_time_synced   | INT64                  | Discrepancy (seconds) between probe's clock and the RIPE Atlas        |
|                    |                        | controller's clock. The value -1 means unknown.                       |
| msm_id             | INT64                  | RIPE Atlas measurement id                                             |
| group_id           | INT64                  | RIPE Atlas measurement-group id                                       |
| src_addr           | STRING                 | IP Address of the interface used by RIPE Atlas probe                  |
| src_addr_bytes     | BYTES                  | value of the src_addr field as a bytes representation                 |
| dst_addr           | STRING                 | IP address of the DNS server as used by the probe                     |
| dst_addr_bytes     | BYTES                  | value of the dst_addr fiels as a bytes representation                 |
| synth_addr         | STRING                 | IP address of the probe as synthesized by the RIPE Atlas controller   |
| synth_addr_bytes   | BYTES                  | value of the synth_addr field as a bytes representation               |
| dst_name           | STRING                 | Hostname of the DNS server as used by the probe                       |
| start_time         | TIMESTAMP              | start time of the measurement                                         |
| start_hour         | INT64                  | time hour of the day                                                  |
| query              | STRING                 | Query payload send to the DNS server. UU encoded                      |
| retry_count        | INT64                  | Number of retries of the DNS request                                  |
| wire_message       | STRING                 | The RFC1035 4.1 DNS message as received from the server. UU encoded.  |
| header_ANCOUNT     | INT64                  | ANCOUNT field from the `Header` section of the answer RFC1035 4.1.1   |
| header_ARCOUNT     | INT64                  |                                                                       |
| header_ID          | INT64                  |                                                                       |
| header_QDCOUNT     | INT64                  |                                                                       |
| response_time      | FLOAT64                |                                                                       |
| size               | INT64                  |                                                                       |
| error              | STRING                 | output of the GETADDRINFO(3) system call on the probe                 |
| answers            | ARRAY<STRUCT<          |                                                                       |
|   answers.MNAME    |   STRING               | field from the 'answer' section of the DNS message                    |
|   answers.NAME     |   STRING               | field from the 'answer' section of the DNS message                    |
|   answers.RNAME    |   STRING               | field from the 'answer' section of the DNS message                    |
|   answers.SERIAL   |   INT64                | field from the 'answer' section of the DNS message                    |
|   answers.TTL      |   INT64                | field from the 'answer' section of the DNS message                    |
|   answers.RDATA    |   STRING               | field from the 'answer' section of the DNS message                    |
|   answers.TYPE     |   STRING               | field from the 'answer' section of the DNS message                    |
|                    | >>                     |                                                                       |
+--------------------+------------------------+-----------------------------------------------------------------------+

```

### Queries

Notice that the DNS results contain the same `qbuf` and `abuf` fields that the RIPE Atlas API returns.



`bq query --udf_resource=<file_path_or_URI> <sql_query>`

More on UDFs:
https://cloud.google.com/bigquery/docs/reference/standard-sql/user-defined-functions

Running from the command line is possible as follows:
```
bq query --project_id=<your project> --use_legacy_sql=false --udf_resource=gs://ripe-atlas-bigquery/scripts/dns.sql 'select dst_addr, query, parse_dns_buffer(TO_CODE_POINTS(FROM_BASE64(query))) query_parsed from `ripencc-atlas`.samples.dns where date(start_time) = "2020-10-21" and   query is not null'
```

```sql
CREATE TEMP FUNCTION parse_dns_buffer(buffer ARRAY<int64>)
RETURNS STRUCT<qdcount INT64, ancount INT64, aucount INT64, adcount INT64, qtype int64, qclass int64, qname string, error string>
LANGUAGE js
OPTIONS (
  library=["gs://ripe-atlas-bigquery/scripts/dns.js"]
)
AS """
  return parse_qbuf(buffer);
""";

select dst_addr, query, parse_dns_buffer(TO_CODE_POINTS(FROM_BASE64(query))) query_parsed
from samples.dns
where date(start_time) = "2020-10-21"
and   query is not null
```

## Parsing the abuf or the qbuf

DNS results have the issue that the DNS responses are binary and stored encoded
in base64. So in order to get at the response to a DNS query, some parsing is
necessary.

Google BigQuery allows for user-defined functions that can then effectively be
parallelised and run on individual results. The language of choice is
JavaScript, but it's still possible to use this fairly easily.

Below is an example that uses some of our code to parse out most parts of DNS
responses: this is operating in the general case, because the data payload for
individual resource types is defined per type, so the script below decodes
everything but bundles the actual data into String containing the byte values
separated by commas.

In the less general case -- say you wanted to parse only AAAA queries -- it'd
be possible instead to focus on those and parse appropriately.

The Javascript code referred to in the code snippet here should be regarded as
a template or a prototype: it's a great starting point, but it's not been
heavily road-tested. Feedback or suggestions for that code are most welcome!

### abuf

```sql
CREATE TEMP FUNCTION parse_dns_buffer(buffer ARRAY<INT64>)
  RETURNS STRUCT<
    id INT64,
    flag_query BOOL,
    flag_opcode STRING,
    flag_auth BOOL,
    flag_trunc BOOL,
    flag_recurse_desired BOOL,
    flag_recurse_avail BOOL,
    flag_rcode STRING,
    qdcount INT64,
    ancount INT64,
    aucount INT64,
    adcount INT64,
    payload ARRAY<STRUCT<
      section STRING,
      type STRING,
      class STRING,
      ttl INT64,
      name STRING,
      data STRING
      >>
    >
LANGUAGE js
OPTIONS (
  library=["gs://ripe-atlas-bigquery/scripts/dns.js"]
)
AS
"""
  return parse_wire_message(buffer);
""";

select * except(wire_message), parse_dns_buffer(TO_CODE_POINTS(FROM_BASE64(wire_message))) answer_parsed
from `ripencc-atlas`.samples.dns
where date(start_time) = "2020-10-21"
limit 10

```


### qbuf

```sql
CREATE TEMP FUNCTION parse_dns_buffer(buffer ARRAY<INT64>)
  RETURNS STRUCT<
    id INT64,
    flag_query BOOL,
    flag_opcode STRING,
    flag_auth BOOL,
    flag_trunc BOOL,
    flag_recurse_desired BOOL,
    flag_recurse_avail BOOL,
    flag_rcode STRING,
    qdcount INT64,
    payload ARRAY<STRUCT<
      section STRING,
      type STRING,
      class STRING,
      ttl INT64,
      name STRING,
      data STRING
      >>
    >
LANGUAGE js
OPTIONS (
  library=["gs://ripe-atlas-bigquery/scripts/dns.js"]
)
AS
"""
  return parse_query(buffer);
""";

select * except(query), parse_dns_buffer(TO_CODE_POINTS(FROM_BASE64(query))) query_parsed
from `ripencc-atlas`.samples.dns
where query is not null
limit 10
```

