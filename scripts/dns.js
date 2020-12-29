const rrtype_table = {
	1: "A",
	2: "NS",
	5: "CNAME",
	6: "SOA",
	11: "WKS",
	12: "PTR",
	13: "HINFO",
	14: "MINFO",
	15: "MX",
	16: "TXT",
	17: "RP",
	18: "AFSDB",
	19: "X25",
	20: "ISDN",
	21: "RT",
	22: "NSAP",
	23: "NSAP-PTR",
	24: "SIG",
	25: "KEY",
	26: "PX",
	27: "GPOS",
	28: "AAAA",
	29: "LOC",
	31: "EID",
	32: "NIMLOC",
	33: "SRV",
	34: "ATMA",
	35: "NAPTR",
	36: "KX",
	37: "CERT",
	39: "DNAME",
	40: "SINK",
	41: "OPT",
	42: "APL",
	43: "DS",
	44: "SSHFP",
	45: "IPSECKEY",
	46: "RRSIG",
	47: "NSEC",
	48: "DNSKEY",
	49: "DHCID",
	50: "NSEC3",
	51: "NSEC3PARAM",
	52: "TLSA",
	53: "SMIMEA",
	55: "HIP",
	56: "NINFO",
	57: "RKEY",
	58: "TALINK",
	59: "CDS",
	60: "CDNSKEY",
	61: "OPENPGPKEY",
	62: "CSYNC",
	63: "ZONEMD",
	64: "SVCB",
	65: "HTTPS",
	99: "SPF",
	100: "UINFO",
	101: "UID",
	102: "GID",
	103: "UNSPEC",
	104: "NID",
	105: "L32",
	106: "L64",
	107: "LP",
	108: "EUI48",
	109: "EUI64",
	249: "TKEY",
	250: "TSIG",
	251: "IXFR",
	252: "AXFR",
	253: "MAILB",
	254: "MAILA",
	255: "*",
	256: "URI",
	257: "CAA",
	258: "AVC",
	259: "DOA",
	260: "AMTRELAY",
	32768: "TA"
}

const rrclass_table = {
	1: "IN",
	2: "CH"
}

const dns_opcodes = {
	0: "Query",
	1: "Inverse Query",
	2: "Status",
	4: "Notify",
	5: "Update",
	6: "DNS Stateful Operations"
}

const dns_rcodes = {
	0: "NoError",
	1: "FormErr",
	2: "ServFail",
	3: "NXDomain",
	4: "NotImp",
	5: "Refused",
	6: "YXDomain",
	7: "YXRRSet",
	8: "NXRRSet",
	9: "NotAuth",
	10: "NotAuth",
	11: "NotZone",
	16: "BADVERS/BADSIG",
	17: "BADKEY",
	18: "BADTIME",
	19: "BADMODE",
	20: "BADNAME",
	21: "BADALG",
	22: "BADTRUNC",
	23: "BADCOOKIE"
}

function map_rrtype(value)
{
	return rrtype_table[value] || value;
}

function map_rrclass(value)
{
	return rrclass_table[value] || value;
}

function parse_question(buffer, i)
{
	let qname = "";
	for ( ; i < buffer.length; ) {
		const length = parseInt(buffer[i++]);
		if (length === 0) {
			break;
		}

		for (let j = 0; j < length; j++) {
			qname += String.fromCharCode( buffer[i] );
			i++;
		}
		qname += ".";
	}

	const qtype  = parseInt((buffer[i] << 8) | buffer[i+1]);
	i += 2;
	const qclass = parseInt((buffer[i] << 8) | buffer[i+1]);
	i += 2;

	return [qtype, qclass, qname, i];
}



//4.1.3. Resource record format
//
//The answer, authority, and additional sections all share the same
//format: a variable number of resource records, where the number of
//records is specified in the corresponding count field in the header.
//Each resource record has the following format:
//                                    1  1  1  1  1  1
//      0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
//    |                                               |
//    /                                               /
//    /                      NAME                     /
//    |                                               |
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
//    |                      TYPE                     |
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
//    |                     CLASS                     |
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
//    |                      TTL                      |
//    |                                               |
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
//    |                   RDLENGTH                    |
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--|
//    /                     RDATA                     /
//    /                                               /
//    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+


function parse_record_data(buffer, rtype, rclass, i, l)
{
	let data = [];

	/* May be able to do something smart with some types here.
	 * Currently just returning a byte arrray. */
	switch (rtype) {
	case "A": {
		data = buffer.slice(i, i+l).join(".");
		break;
	}
	case "AAAA": {
		data = buffer.slice(i, i+l).reduce((output, dat) =>
			(output + ('0' + (dat & 0xff).toString(16)).slice(-2)),
			'');
		break;
	}
	case "OPT": {
		data = buffer.slice(i, i+l);
		break;
	}
	default: {
		data = buffer.slice(i, i+l);
	}
	break;
	}

	return data.toString();
}

function parse_rr(buffer, i)
{
	let rname = "";
	let position = i;
	let compression = false;
	for ( ; position < buffer.length; ) {

		let length = parseInt(buffer[position++]);

		// header compression; this is referring to a name someplace else
		if (length >= 192) {
			position = ((length - 192) << 8) | parseInt(buffer[position++]);
			compression = true;
			// set length for start of redirected string
			length = parseInt(buffer[position++]);
		}

		if (length === 0) {
			break;
		}

		for (let j = 0; j < length; j++) {
			rname += String.fromCharCode( buffer[position] );
			position++;
		}
		rname += ".";
	}

	if (compression === false) {
		i = position;
	}
	else {
		i += 2;
	}

	const rtype  = map_rrtype(parseInt( (buffer[i] << 8) | buffer[i+1]));
	i += 2;
	const rclass = map_rrclass(parseInt((buffer[i] << 8) | buffer[i+1]));
	i += 2;
	const ttl = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
	i += 4;

	const l = parseInt((buffer[i] << 8) | buffer[i+1]);
	i += 2;

	data = parse_record_data(buffer, rtype, rclass, i, l);

	i += l;

	return [rtype, rclass, rname, ttl, data, i]
}

function parse_rr_set(buffer, section, record_count, i, output)
{
	for (let count = 0; count < record_count; count++) {
		//print("["+count+"/"+record_count+"] "+section+": Parsing from ",i);
		let rrtype  = -1;
		let rrclass = -1;
		let rrttl   = -1;
		let rrname  = "";
		let rrdata  = [];
		[rrtype, rrclass, rrname, rrttl, rrdata, i] = parse_rr(buffer, i);

		output.push( {"section": section, "type": rrtype, "class": rrclass, "ttl": rrttl, "name": rrname, "data": rrdata} );
	}

	return i;
}


function parse_wire_message(buffer)
{
	if (buffer === null) {
		return {'type':0, 'class':0, 'name':"", 'error':"null buffer"};
	}
	if (buffer.length < 12) {
		return {'type':0, 'class':0, 'name':"", 'error':"short buffer"};
	}

	const id      = parseInt((buffer[0]  << 8) | buffer[1]);

	const flags   = parseInt((buffer[2]  << 8) | buffer[3]);
	const flag_query_val           = parseInt((flags & 0x8000) >> 15);
	const flag_opcode_val          = parseInt((flags & 0x7800) >> 11);
	const flag_auth_val            = parseInt((flags & 0x0400) >> 10);
	const flag_trunc_val           = parseInt((flags & 0x0200) >>  9);
	const flag_recurse_desired_val = parseInt((flags & 0x0100) >>  8);
	const flag_recurse_avail_val   = parseInt((flags & 0x0080) >>  7);
	const flag_z_val               = parseInt((flags & 0x0070) >>  4);
	const flag_rcode_val           = parseInt((flags & 0x000f)      );

	const flag_query           = (flag_query_val === 0)           ? true : false;
	const flag_opcode          = dns_opcodes[flag_opcode_val] || "Unassigned";
	const flag_auth            = (flag_auth_val  === 1)           ? true : false;
	const flag_trunc           = (flag_trunc_val === 1)           ? true : false;
	const flag_recurse_desired = (flag_recurse_desired_val === 1) ? true : false;
	const flag_recurse_avail   = (flag_recurse_avail_val   === 1) ? true : false;
	const flag_z               = flag_z_val;
	const flag_rcode           = dns_rcodes[flag_rcode_val] || "Unassigned/Reserved";


	const qdcount = parseInt((buffer[4]  << 8) | buffer[5]);
	const ancount = parseInt((buffer[6]  << 8) | buffer[7]);
	const aucount = parseInt((buffer[8]  << 8) | buffer[9]);
	const adcount = parseInt((buffer[10] << 8) | buffer[11]);
	let output = [];

	let i = 12;
	for (let count = 0; count < qdcount; count++) {

		let qtype  = -1;
		let qclass = -1;
		let qdata  = "";
		[qtype, qclass, qdata, i] = parse_question(buffer, i);

		output.push( {"section": "query", "type": qtype, "class": qclass, "name": qdata} );
	}

	i = parse_rr_set(buffer, "answer",     ancount, i, output);
	i = parse_rr_set(buffer, "authority",  aucount, i, output);
	i = parse_rr_set(buffer, "additional", adcount, i, output);

	if (buffer.length !== i) {
		// pack an error and some state that may help debug
		error = {"section": "parse error", "type": buffer.length, "class": i, "name": "bad buffer length"};
		output.push(error);
	}

	return {
		"id":                   id,
		"flag_query":           flag_query,
		"flag_opcode":          flag_opcode,
		"flag_auth":            flag_auth,
		"flag_trunc":           flag_trunc,
		"flag_recurse_desired": flag_recurse_desired,
		"flag_recurse_avail":   flag_recurse_avail,
		"flag_rcode":           flag_rcode,
		"qdcount":              qdcount,
		"ancount":              ancount,
		"aucount":              aucount,
		"adcount":              adcount,
		"payload":              output
	};
}

function parse_query(buffer)
{
	const tmp = parse_wire_message(buffer);

	return {
		"id":                   tmp.id,
		"flag_query":           tmp.flag_query,
		"flag_opcode":          tmp.flag_opcode,
		"flag_auth":            tmp.flag_auth,
		"flag_trunc":           tmp.flag_trunc,
		"flag_recurse_desired": tmp.flag_recurse_desired,
		"flag_recurse_avail":   tmp.flag_recurse_avail,
		"flag_rcode":           tmp.flag_rcode,
		"qdcount":              tmp.qdcount,
		"payload":              tmp.payload
	};
}

