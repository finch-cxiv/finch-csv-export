/**
* This is a description
* @namespace diopsi.de
* @method ~~~~~~~~~
* @param {String} some string
* @param {Object} some object
* @return {bool} some bool
*/

let URL_client = (new URL(document.location));
let params = (new URL(document.location)).searchParams;
let code = params.get('code');
let grand_object = { directory: "blank", payment: "blank", pay_statement: "blank", status: { directory: "null", payment: "null", pay_statement: "null" } }

function object_api_finch() { return { URL: "https://test.cxiv.io" }; }
//function object_api_finch() { return {URL:"http://localhost:3000"};}
function object_element() { return [{ id: "finch-logo", tag: "logo" }, { id: "connect-button" }]; }
function object_class() { return ["animate-draw", "animate-erase", "visible", "hidden", "fade-display", "fade-hide"]; }

async function kickoff_process() {
    var startdate = document.getElementById('start-date').value
    var enddate = document.getElementById('end-date').value
    var parameters = {
        start_date: startdate,
        end_date: enddate,
    }
    document.getElementById("status_directory").innerHTML = "getting directory...";
    document.getElementById("status_payments").innerHTML = "getting payments...";
    document.getElementById("status_pay_statements").innerHTML = "getting pay statements...";
    var fetch_return_directory = await api_finch('default', 'GET', 'directory');
    if (fetch_return_directory.code === 429) {
        document.getElementById("status_directory").innerHTML = "Finch rate limit hit (429) give it a minute";
        document.getElementById("status_payments").innerHTML = "Finch rate limit hit (429) give it a minute";
        document.getElementById("status_pay_statements").innerHTML = "Finch rate limit hit (429) give it a minute";
    }
    else {
        grand_object.directory = fetch_return_directory;
        grand_object.status.directory = "GO"
        var directory_length = grand_object.directory.individuals.length;
        document.getElementById("status_directory").innerHTML = "loaded " + directory_length + " individuals";
        var fetch_return_payments = await api_finch('default', 'POST', 'payment', parameters);
        var length_payments = fetch_return_payments.length
        if (fetch_return_payments.code === 429) {
            document.getElementById("status_payments").innerHTML = "Finch rate limit hit (429) give it a minute";
            document.getElementById("status_pay_statements").innerHTML = "Finch rate limit hit (429) give it a minute";
        }
        else if (length_payments === 0) {
            document.getElementById("status_payments").innerHTML = "no payments for selected range";
            document.getElementById("status_pay_statements").innerHTML = "no payments for selected range";
        }
        else {
            grand_object.payment = fetch_return_payments;
            grand_object.status.payment = "GO"
            var payments_length = grand_object.payment.length;
            document.getElementById("status_payments").innerHTML = "loaded " + payments_length + " payments";
            var payment_id_list = []
            var payment_id_length = grand_object.payment.length
            for (let i = 0; i < payment_id_length; i++) {
                id_value = grand_object.payment[i].id
                push_value = { payment_id: id_value }
                payment_id_list.push(push_value)
            }
            payment_id_list = { requests: payment_id_list }
            var fetch_return_pay_statements = await api_finch('default', 'POST', 'pay-statement', payment_id_list);
            if (fetch_return_pay_statements.code === 429) {
                document.getElementById("status_pay_statements").innerHTML = "Finch rate limit hit (429) give it a minute";
            }
            else {
                grand_object.pay_statement = fetch_return_pay_statements;
                grand_object.status.pay_statement = "GO";
                var pay_statement_length = grand_object.pay_statement.responses.length;
                document.getElementById("status_pay_statements").innerHTML = "loaded " + pay_statement_length + " pay statements";
            }
        
        }
    }

    console.log('GRAND_OBJECT')
    console.log(grand_object)

    if (grand_object.status.pay_statement === "GO" && grand_object.status.payment === "GO" && grand_object.status.directory === "GO") {
        var export_array = build_flat_list_deliver(grand_object.directory, grand_object.payment, grand_object.pay_statement);
        export_csv(export_array);
    }

}

async function api_finch(URL, method, resource, data) {

    var URL = object_api_finch().URL
    console.log("api_finch: " + method + " " + URL + "/" + resource)
    console.log(data)

    var return_data = await fetch(URL + "/" + resource, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error, status = ${response.status}`);
            }
            return response.json();
        })
        .then((my_json) => {
            var my_json = my_json;
            return my_json
        })
        .catch((error) => {
            const p = document.createElement("p");
            p.appendChild(document.createTextNode(`Error: ${error.message}`));
        });

    return return_data
};

function build_flat_list_deliver(DIRECTORY, PAYMENT, PAYMENT_STATEMENT) {

    var complete_JSON_table = build_json_table(DIRECTORY, PAYMENT, PAYMENT_STATEMENT)
    var column_groups = build_column_groups(complete_JSON_table)
    var length_complete_JSON_table = complete_JSON_table.length

    console.log('complete_JSON_table')
    console.log(complete_JSON_table)
    console.log("----------------------------------------------------------------------------------------------------")

    console.log('column_groups')
    console.log(column_groups)
    console.log("----------------------------------------------------------------------------------------------------")

    var header_base = [
        ['group', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['type', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['name', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['employer/pre_tax', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['-', 'name', 'pay_date', 'debit_date', 'pay_period', 'type', 'total_hours', 'gross_pay', 'net_pay'],
    ]

    var height_header_base = header_base.length
    console.log('HEIGHT HEADER BASE')
    console.log(height_header_base)

    var complete_array_table = header_base

    //first column just appends alll the -s
    for (let i = 0; i < length_complete_JSON_table; i++) {
        complete_array_table.push(['-'])
    }

    //name column
    col_a = 1
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].first_name + '~' + complete_JSON_table[i].last_name
    }

    //pay_date column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].pay_date
    }

    //debit_date column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].debit_date
    }

    //pay_period column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].pay_period.start_date + ' - ' + complete_JSON_table[i].pay_period.end_date
    }

    //type column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].type
    }

    //total_hours column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].total_hours
    }

    //gross_pay column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].gross_pay.amount
    }

    //net_pay column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].net_pay.amount
    }

    //EARNINGS COLUMNS
    column_groups_earnings = column_groups.earnings
    length_column_groups_earnings = column_groups_earnings.length
    if (length_column_groups_earnings > 0) {
        for (let i = 0; i < length_column_groups_earnings; i++) {
            col_a++
            HEADER_current_earning = column_groups_earnings[i]
            filter_type = HEADER_current_earning.type
            filter_name = HEADER_current_earning.name
            var header_values = ['EARNINGS', filter_type, filter_name, '---', 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }
            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].earnings
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }
            }

        }

    }

    //TAXES COLUMNS
    column_groups_taxes = column_groups.taxes
    length_column_groups_taxes = column_groups_taxes.length
    if (length_column_groups_taxes > 0) {
        for (let i = 0; i < length_column_groups_taxes; i++) {
            col_a++
            HEADER_current_taxes = column_groups_taxes[i]
            filter_type = HEADER_current_taxes.type
            filter_name = HEADER_current_taxes.name
            filter_employer = HEADER_current_taxes.employer
            var header_values = ['TAXES', filter_type, filter_name, filter_employer, 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }

            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].taxes
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                row_a_list = _.filter(row_a_list, ['employer', filter_employer])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }

            }
        }

    }

    //DEDUCTIONS COLUMNS
    column_groups_deductions = column_groups.deductions
    length_column_groups_deductions = column_groups_deductions.length
    if (length_column_groups_deductions > 0) {
        for (let i = 0; i < length_column_groups_deductions; i++) {
            col_a++
            HEADER_current_deductions = column_groups_deductions[i]
            filter_type = HEADER_current_deductions.type
            filter_name = HEADER_current_deductions.name
            filter_pre_tax = HEADER_current_deductions.pre_tax
            var header_values = ['DEDUCTIONS', filter_type, filter_name, filter_pre_tax, 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }
            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].employee_deductions
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                row_a_list = _.filter(row_a_list, ['pre_tax', filter_pre_tax])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }

            }
        }

    }

    //CONTRIBUTIONS COLUMNS - employer_contributions
    column_groups_contributions = column_groups.contributions
    length_column_groups_contributions = column_groups_contributions.length
    if (length_column_groups_contributions > 0) {
        for (let i = 0; i < length_column_groups_contributions; i++) {
            col_a++
            HEADER_current_contributions = column_groups_contributions[i]
            filter_type = HEADER_current_contributions.type
            filter_name = HEADER_current_contributions.name
            var header_values = ['CONTRIBUTIONS', filter_type, filter_name, '---', 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }
            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].employer_contributions
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }

            }
        }

    }

    //FOR TESTING ADD INDIVIDUAL ID COLUMNS
    if (length_column_groups_contributions > 0) {
        col_a++
        for (let row_a = 0; row_a < height_header_base; row_a++) {
            complete_array_table[row_a][col_a] = 'INDIVIDUAL_ID'
        }
        for (let i = 0; i < length_complete_JSON_table; i++) {
            row_a = i + height_header_base
            complete_array_table[row_a][col_a] = complete_JSON_table[i].individual_id
        }
    }

    //FOR TESTING ADD PAYMENT ID COLUMNS
    if (length_column_groups_contributions > 0) {
        col_a++
        for (let row_a = 0; row_a < height_header_base; row_a++) {
            complete_array_table[row_a][col_a] = 'PAYMENT_ID'
        }
        for (let i = 0; i < length_complete_JSON_table; i++) {
            row_a = i + height_header_base
            complete_array_table[row_a][col_a] = complete_JSON_table[i].payment_id
        }
    }

    console.log('complete_array_table')
    console.log(complete_array_table)
    console.log("----------------------------------------------------------------------------------------------------")

    return complete_array_table;

}

function build_json_table(DIRECTORY, PAYMENT, PAYMENT_STATEMENT) {
    var directory = DIRECTORY.individuals
    var payment = PAYMENT
    var pay_statement = PAYMENT_STATEMENT.responses

    var flat_pay_statement = flatten_pay_statement(pay_statement)
    var directory_list_rekeyed = renameKeyInJsonTable(directory, 'id', 'individual_id')
    var payment_list_rekeyed = renameKeyInJsonTable(payment, 'id', 'payment_id')
    var payment_list_rekeyed = renameKeyInJsonTable(payment, 'gross_pay', 'payment_full_gross_pay')
    var payment_list_rekeyed = renameKeyInJsonTable(payment, 'net_pay', 'payment_full_net_pay')

    var join_directory_paystatements = join_ADD_MISSING_KEYS(flat_pay_statement, directory_list_rekeyed, 'individual_id')
    var list_fully_merged = join_ADD_MISSING_KEYS(join_directory_paystatements, payment_list_rekeyed, 'payment_id')

    return list_fully_merged;

}

function flatten_pay_statement(pay_statement_list) {

    var pay_statement_list_length = pay_statement_list.length
    var pay_statement_flattened = []

    //extracts and flattens all the pay-statements into a list
    for (let i = 0; i < pay_statement_list_length; i++) {
        var pay_statement_list_current = pay_statement_list[i].body.pay_statements
        var pay_statement_list_current_ID = pay_statement_list[i].payment_id
        var pay_statement_list_current_length = pay_statement_list_current.length
        for (let i = 0; i < pay_statement_list_current_length; i++) {
            var pay_statement_current = pay_statement_list_current[i]
            pay_statement_current.payment_id = pay_statement_list_current_ID
            pay_statement_flattened.push(pay_statement_current)
        }
    }

    console.log("pay_statement_flattened")
    console.log(pay_statement_flattened)
    pay_statement_flattened = _.sortBy(pay_statement_flattened, 'individual_id');

    pay_statement_flattened_length = pay_statement_flattened.length

    return pay_statement_flattened;
}

function build_column_groups(pay_statement_flattened) {

    pay_statement_flattened_length = pay_statement_flattened.length

    //these objects will define the columns built for export
    var COLUMN_EARNINGS = []
    var COLUMN_TAXES = []
    var COLUMN_DEDUCTIONS = []
    var COLUMN_CONTRIBUTIONS = []

    join_fields_earnings_contributions = ['type', 'name']
    join_fields_taxes = ['type', 'name', 'employer']
    join_fields_deductions = ['type', 'name', 'pre_tax']

    for (let i = 0; i < pay_statement_flattened_length; i++) {

        var current_EARNINGS = pay_statement_flattened[i].earnings
        var current_TAXES = pay_statement_flattened[i].taxes
        var current_DEDUCTIONS = pay_statement_flattened[i].employee_deductions
        var current_CONTRIBUTIONS = pay_statement_flattened[i].employer_contributions

        var COLUMN_EARNINGS_length = COLUMN_EARNINGS.length
        var COLUMN_TAXES_length = COLUMN_TAXES.length
        var COLUMN_DEDUCTIONS_length = COLUMN_DEDUCTIONS.length
        var COLUMN_CONTRIBUTIONS_length = COLUMN_CONTRIBUTIONS.length

        if (COLUMN_EARNINGS_length == 0) {
            COLUMN_EARNINGS = current_EARNINGS
        }
        else {
            COLUMN_EARNINGS = join_ADD_MISSING_OBJECTS(COLUMN_EARNINGS, current_EARNINGS, join_fields_earnings_contributions)
        }

        if (COLUMN_TAXES_length == 0) {
            COLUMN_TAXES = current_TAXES
        }
        else {
            COLUMN_TAXES = join_ADD_MISSING_OBJECTS(COLUMN_TAXES, current_TAXES, join_fields_taxes)
        }

        if (COLUMN_CONTRIBUTIONS_length == 0) {
            COLUMN_CONTRIBUTIONS = current_CONTRIBUTIONS
        }
        else {
            COLUMN_CONTRIBUTIONS = join_ADD_MISSING_OBJECTS(COLUMN_CONTRIBUTIONS, current_CONTRIBUTIONS, join_fields_earnings_contributions)
        }

        if (COLUMN_DEDUCTIONS_length == 0) {
            //console.log('COLUMN_DEDUCTIONS_length')
            //console.log(COLUMN_DEDUCTIONS_length)
            COLUMN_DEDUCTIONS = current_DEDUCTIONS
        }
        else {
            COLUMN_DEDUCTIONS = join_ADD_MISSING_OBJECTS(COLUMN_DEDUCTIONS, current_DEDUCTIONS, join_fields_deductions)
        }


    }

    var column_groups = { taxes: COLUMN_TAXES, earnings: COLUMN_EARNINGS, contributions: COLUMN_CONTRIBUTIONS, deductions: COLUMN_DEDUCTIONS }

    return column_groups;
}

function renameKeyInJsonTable(jsonTable, oldKey, newKey) {
    if (oldKey === newKey) {
        return jsonTable;
    }

    return jsonTable.map(obj => {
        if (Object.prototype.hasOwnProperty.call(obj, oldKey)) {
            obj[newKey] = obj[oldKey];
            delete obj[oldKey];
        }
        return obj;
    });
}

function join_ADD_MISSING_OBJECTS(list1, list2, joinKeys) {
    const joinedList = [...list1];

    list2.forEach(item2 => {
        const matchIndex = joinedList.findIndex(item1 =>
            joinKeys.every(key => item1[key] === item2[key])
        );

        if (matchIndex === -1) {
            joinedList.push(item2);
        }
    });

    return joinedList;
}

function join_ADD_MISSING_KEYS(arr1, arr2, key) {
    return arr1.map(obj1 => {
        const matchingObj2 = arr2.filter(obj2 => obj2[key] === obj1[key])[0];
        return { ...obj1, ...matchingObj2 };
    });
}

function export_csv(flat_list_deliver) {
    //BUILD CSV EXPORT
    let csvContent = "data:text/csv;charset=utf-8,"
        + flat_list_deliver.map(e => e.join(",")).join("\n");
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
}
