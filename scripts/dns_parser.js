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
	3: "CH"
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
const option_type = {
    3: "NSID" // Add other fields 
}


function map_rrtype(value)
{
	return rrtype_table[value] || value;
}

function map_rrtype_edns0(value)
{
    return option_type[value] || value;
}


function map_rrclass(value)
{
	return rrclass_table[value] || value;
}

function parse_name(buffer, i)
{
    let name = "";
	let position = i;
	let compression = false;

	for ( ; position < buffer.length; ) {

		let length = parseInt(buffer[position++]);

		if (length === 0) {
			if (compression === false) {
				i++;
			}
			break;
		}

		// header compression; this is referring to a name someplace else
		// RFC1035, Section 4.1.4:
		// The first two bits are ones.  This allows a pointer to be distinguished
		// from a label, since the label must begin with two zero bits because
		// labels are restricted to 63 octets or less.
		if (length >= 192) {
			const old_position = position;
			const new_position = ((length - 192) << 8) | parseInt(buffer[position++]);

			// We definitely can't seek beyond the end of the buffer
			if (new_position > buffer.length) {
				return -1;
			}

			position = new_position;

			if (compression === false) {
				compression = true;

				// two bytes describe the compression: compression flag + new_position
				// compressed strings can themselves refer to compressed strings,
				// so only increment once for the top level of the main stream
				i += 2;
			}
			// set length for start of redirected string
			length = parseInt(buffer[position++]);
		}

		for (let j = 0; j < length; j++) {
			const character = String.fromCharCode( buffer[position] );
			// We've found a null character, so probably the length is wrong.
			// Rather than try to guess, just bail out.
			if (character === '\0') {
				return -1;
			}
			name += character;
			position++;
		}
		name += ".";
		if (compression === false) {
			i = position;
		}
	}
	if (name.length === 0) {
        name += ".";
    }

	return [name, i];
}

function parse_question(buffer, i)
{
	const out = parse_name(buffer, i);
	if (out === -1) {
		return -1;
	}
	[qname, i] = out;

	const qtype  = map_rrtype(parseInt((buffer[i] << 8) | buffer[i+1]));
	i += 2;
	const qclass = map_rrclass(parseInt((buffer[i] << 8) | buffer[i+1]));
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
	const end = i+l;

    

	switch (rtype) {
	case "A": {
		data = buffer.slice(i, i+l).join(".");

		// Mash the IPv4 address into hex, so it should be 8 chars long.
		// It's possible with a truncated buffer to not grab a full IP addr,
		// which breaks calls to net.ip_from_string
		const tmp_str = buffer.slice(i, i+l).reduce((output, dat) =>
			(output + ('0' + (dat & 0xff).toString(16)).slice(-2)),
			'');
		if (tmp_str.length !== 8) {i
			return -1;
		}

		break;
	}
	case "AAAA": {
		data = buffer.slice(i, i+l).reduce((output, dat) =>
			(output + ('0' + (dat & 0xff).toString(16)).slice(-2)),
			'');
		if (data.length !== 32) {
			// 32 hex digits == 128 bits
			// if the length is less, the buffer is incomplete
			return -1;
		}

		data =  data.substring(0,4) + ":" +
			data.substring(4,8) + ":" +
			data.substring(8,12) + ":" +
			data.substring(12,16) + ":" +
			data.substring(16,20) + ":" +
			data.substring(20,24) + ":" +
			data.substring(24,28) + ":" +
			data.substring(28,32)

		break;
	}
	case "CNAME": {
		let out = 

        parse_name(buffer, i);
		if (out === -1) {
			return -1;
		}
		[cname, i] = out;

		data = cname;

		break;
	}
	case "OPT": {
		
        data = buffer.slice(i, i+l);
		offset = 1;
        let name ="";
        code = data[offset];
        if (code ===3) //only parsing for nsid
        {
            offset +=2;
            length = data[offset];
            if (length === 0) {                 
                break; 
            }
            offset +=1;
            for (let j = 0; j < length; j++) {
                const character = String.fromCharCode( data[j+offset] );
                name += character;
            }
            data=name;
        }
        break;
        
	}
	case "NS": {
		let out = parse_name(buffer, i);
		if (out === -1) {
			return -1;
		}
		[dname, i] = out;

		data = dname;

		break;
	}
	case "SOA": {
		let out = parse_name(buffer, i);
		if (out === -1) {
			return -1;
		}
		[mname, i] = out;

		out = parse_name(buffer, i);
		if (out === -1) {
			return -1;
		}
		[rname, i] = out;

		const serial = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
		i += 4;
		const refresh = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
		i += 4;
		const retry = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
		i += 4;
		const expire = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
		i += 4;
		const minimum = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
		i += 4;

		data = mname + " " + rname + " " + serial + " " + refresh + " " + retry + " " + expire + " " + minimum;

		break;
	}
	case "TXT": {
		let name = "";

		for ( ; i < end; ) {
			let length = parseInt(buffer[i++]);

			if (length === 0) {
				break;
			}

			name += "\"";

			for (let j = 0; j < length; j++) {
				const character = String.fromCharCode( buffer[i] );
				// We've found a null character, so probably the length is wrong.
				// Rather than try to guess, just bail out.
				name += character;
				i++;
			}

			name += "\"";
			if (i < end) {
				name += " ";
			}
		}

		i += 2;

		data = name;

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
	// We definitely can't seek beyond the end of the buffer
	if (i > buffer.length) {
		return -1;
	}

	const out = parse_name(buffer, i);
	if (out === -1) {
		return -1;
	}

	[rname, i] = out;

	const rtype  = map_rrtype(parseInt( (buffer[i] << 8) | buffer[i+1]));
	i += 2;

	const rclass = map_rrclass(parseInt((buffer[i] << 8) | buffer[i+1]));
	i += 2;
	const ttl = parseInt((buffer[i] << 24) | (buffer[i+1] << 16) |  (buffer[i+2] << 8) | buffer[i+3]);
	i += 4;

	const l = parseInt((buffer[i] << 8) | buffer[i+1]);
	i += 2;

	data = parse_record_data(buffer, rtype, rclass, i, l);
	if (data === -1) {
		// there was a parse error
		return -1;
	}
    if (rtype ==='OPT')
    {
        rname = option_type[buffer[i+1]] || "."
    }

	i += l;

	return [rtype, rclass, rname, ttl, data, i]
}

function parse_rr_set(buffer, section, record_count, i, output)
{
	for (let count = 0; count < record_count; count++) {
		let rrtype  = -1;
		let rrclass = -1;
		let rrttl   = -1;
		let rrname  = "";
		let rrdata  = [];
		parsed = parse_rr(buffer, i);
		if (parsed === -1) {
			return -1;
		}

		[rrtype, rrclass, rrname, rrttl, rrdata, i] = parsed;

		output.push( {"section": section, "type": rrtype, "class": rrclass, "ttl": rrttl, "name": rrname, "data": rrdata} );
	}

	return i;
}


const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function atob(input)
{
	let str = input.replace(/=+$/, '');
	let output = '';

	if (str.length % 4 === 1) {
		throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
	}
	for (let bc = 0, bs = 0, buffer, i = 0;
		buffer = str.charAt(i++);
		~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
		buffer = chars.indexOf(buffer);
	}

	let i = []
	for (j = 0 ; j < output.length; j++) {
		i.push(output.charCodeAt(j));
	}

	return i;
}



function parse_wire_message(buffer)
{
	if (buffer === null) {
		return {'type':0, 'class':0, 'name':"", 'error':"null buffer"};
	}

	buffer = atob(buffer);

	if (buffer.length < 12) {
		return {'type':0, 'class':0, 'name':"", 'error':"short buffer"};
	}


	/* https://tools.ietf.org/html/rfc1035
	 *
	 * 4.1.1. Header section format
	 * 
	 * The header contains the following fields:
	 * 
	 *                                     1  1  1  1  1  1
	 *       0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 *     |                      ID                       |
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 *     |QR|   Opcode  |AA|TC|RD|RA|   Z    |   RCODE   |
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 *     |                    QDCOUNT                    |
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 *     |                    ANCOUNT                    |
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 *     |                    NSCOUNT                    |
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 *     |                    ARCOUNT                    |
	 *     +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
	 */

	const id      = parseInt((buffer[0]  << 8) | buffer[1]);

	const flags_field                = parseInt((buffer[2]  << 8) | buffer[3]);
	const flag_query_val             = parseInt(flags_field & 0x8000);
	const flag_opcode_val            = parseInt((flags_field & 0x7800) >> 11);
	const flag_authoritative_val     = parseInt(flags_field & 0x0400);
	const flag_truncated_val         = parseInt(flags_field & 0x0200);
	const flag_recursion_desired_val = parseInt(flags_field & 0x0100);
	const flag_recursion_avail_val   = parseInt(flags_field & 0x0080);
	const flag_z_val                 = parseInt(flags_field & 0x0040);
	const flag_authentic_data_val    = parseInt(flags_field & 0x0020);
	const flag_checking_disabled_val = parseInt(flags_field & 0x0010);
	const flag_rcode_val             = parseInt(flags_field & 0x000f);

	const flag_query                 = (flag_query_val === 0)             ? true : false;
	const flag_authoritative         = (!flag_query ? ((flag_authoritative_val  === 0) ? false : true) : null);
	const flag_truncated             = (flag_truncated_val === 0)         ? false : true;
	const flag_recursion_desired     = (flag_recursion_desired_val === 0) ? false : true;
	const flag_recursion_avail       = (flag_recursion_avail_val   === 0) ? false : true;
	const flag_z                     = flag_z_val;
	const flag_authentic_data        = (flag_authentic_data_val === 0)    ? false : true;
	const flag_checking_disabled     = (flag_checking_disabled_val === 0) ? false : true;
	const flag_opcode                = (flag_query  ? dns_opcodes[flag_opcode_val] || "Unassigned"          : null);
	const flag_rcode                 = (!flag_query ? dns_rcodes[flag_rcode_val]   || "Unassigned/Reserved" : null);

	const flags = {"query":                 flag_query,
			"opcode":               flag_opcode,
			"authoritative_answer": flag_authoritative,
			"truncated":            flag_truncated,
			"recursion_desired":    flag_recursion_desired,
			"recursion_available":  flag_recursion_avail,
			"z":                    flag_z,
			"authentic_data":       flag_authentic_data,
			"checking_disabled":    flag_checking_disabled,
			"rcode":                flag_rcode};



	const qdcount = parseInt((buffer[4]  << 8) | buffer[5]);
	const ancount = parseInt((buffer[6]  << 8) | buffer[7]);
	const aucount = parseInt((buffer[8]  << 8) | buffer[9]);
	const adcount = parseInt((buffer[10] << 8) | buffer[11]);
	let output = [];

	let bail_out = false;

	let i = 12;
	for (let count = 0; count < qdcount && bail_out === false; count++) {
		let qtype  = -1;
		let qclass = -1;
		let qdata  = "";
		out = parse_question(buffer, i);
		if (out === -1) {
			error = {"error": "parse error in question section"};
			output.push(error);
			bail_out = true;
			i = -1;
		}
		else {
			[qtype, qclass, qdata, i] = out;
			output.push( {"section": "query", "type": qtype, "class": qclass, "name": qdata} );
		}
	}


	if (bail_out === false) {
		i = parse_rr_set(buffer, "answer",     ancount, i, output);
		if (i === -1) {
			error = {"error": "parse error in answer section"};
			output.push(error);
			bail_out = true;
		}
	}
	if (bail_out === false) {
		i = parse_rr_set(buffer, "authority",  aucount, i, output);
		if (i === -1) {
			error = {"error": "parse error in auth section"};
			output.push(error);
			bail_out = true;
		}
	}
	if (bail_out === false) {
		i = parse_rr_set(buffer, "additional", adcount, i, output);
		if (i === -1) {
			error = {"error": "parse error in additional section"};
			output.push(error);
			bail_out = true;
		}
	}
	if (i !== -1 && buffer.length !== i) {
		// pack an error and some state that may help debug
		error = {"error": "bad buffer length. Expected:"+buffer.length+", got:"+i+". Incomplete parse?"};
		output.push(error);
	}

	return {
		"id":      id,
		"flags":   flags,
		"qdcount": qdcount,
		"ancount": ancount,
		"aucount": aucount,
		"adcount": adcount,
		"payload": output
	};
}

function parse_query(buffer)
{
	const tmp = parse_wire_message(buffer);

	return {
		"id":      tmp.id,
		"opcode":  tmp.opcode,
		"rcode":   tmp.rcode,
		"flags":   tmp.flags,
		"qdcount": tmp.qdcount,
		"payload": tmp.payload
	};
}

module = typeof(module) === 'undefined' ? {} : module;
module.exports = parse_wire_message;
