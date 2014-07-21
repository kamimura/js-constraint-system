// The MIT License (MIT)

// Copyright (c) 2014 kamimura, m.kamimura@me.com
// http://sitekamimura.blogspot.com

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
var has_value = function (connector) {
        return connector('has_value');
    },
    get_value = function (connector) {
        return connector('value');
    },
    set_value = function (connector, new_value, informant) {
        return connector('set_value')(new_value, informant);
    },
    forget_value = function (connector, retractor) {
        return connector('forget')(retractor);
    },
    connect = function (connector, new_constraint) {
        return connector('connect')(new_constraint);
    },
    inform_about_value = function (constraint) {
        return constraint('I have a value');
    },
    inform_about_no_value = function (constraint) {
        return constraint('I lost my value');
    },
    for_each_except = function (exception, procedure, ary) {
        var i = 1;
        var loop = function (ary) {
                var ary1 = ary.slice();
                if (ary1.length === 0) {
                    return 'done';
                }
                if (ary1[0] === exception) {
                    ary1.shift();
                    return loop(ary1);
                }
                procedure(ary.shift());
                return loop(ary);
            },
            ary1 = ary.slice();
        
        return loop(ary1);
    },
    adder = function (a1, a2, sum) {
        var process_new_value = function () {
                if (has_value(a1) && has_value(a2)) {
                    return set_value(sum, get_value(a1) + get_value(a2), me);
                }
                if (has_value(a1) && has_value(sum)) {
                    return set_value(a2, get_value(sum) - get_value(a1), me);
                }
                if (has_value(a2) && has_value(sum)) {
                    return set_value(a1, get_value(sum) - get_value(a2), me);
                }
            },
            process_forget_value = function () {
                forget_value(sum, me);
                forget_value(a1, me);
                forget_value(a2, me);
                return process_new_value();
            },
            me = function (request) {
                switch (request) {
                    case 'I have a value':
                        return process_new_value();
                    case 'I lost my value':
                        return process_forget_value();
                    default:
                        throw "Unknown request -- ADDER " + request;
                }
            };
        connect(a1, me);
        connect(a2, me);
        connect(sum, me);
        return me;
    },
    multiplier = function (m1, m2, product) {
        var process_new_value = function () {
                if ((has_value(m1) && (get_value(m2) === 0)) ||
                        (has_value(m2) && (get_value(m1) === 0))) {
                    return set_value(product, 0, me);
                }
                if (has_value(m1) && has_value(m2)) {
                    return set_value(product, get_value(m1) * get_value(m2), me);
                }
                if (has_value(product) && has_value(m1)) {
                    return set_value(m2, get_value(product) / get_value(m1), me);
                }
                if (has_value(product) && has_value(m2)) {
                    return set_value(m1, get_value(product) / get_value(m2), me);
                }
            },
            process_forget_value = function () {
                forget_value(product, me);
                forget_value(m1, me);
                forget_value(m2, me);
                return process_new_value();
            },
            me = function (request) {
                switch (request) {
                    case 'I have a value':
                        return process_new_value();
                    case 'I lost my value':
                        return process_forget_value();
                    default:
                        throw 'Unknown request -- MULTIPLIER ' + request;
                }
            };
        connect(m1, me);
        connect(m2, me);
        connect(product, me);
        return me;
    },
    constant = function (value, connector) {
        var me = function (request) {
                throw "Unknown request -- CONSTANT " + request;
            };
        connect(connector, me);
        set_value(connector, value, me);
        return me;
    };
    probe = function (name, connector) {
        var print_probe = function (value) {
                // 出力: name + ' = ' + value + '\n';b
                console.log(name, '=', value);
            },
            process_new_value = function () {
                return print_probe(get_value(connector));
            },
            process_forget_value = function () {
                return print_probe('?');
            },
            me = function (request) {
                switch (request) {
                    case 'I have a value':
                        return process_new_value();
                    case 'I lost my value':
                        return process_forget_value();
                    default:
                        throw 'Unknown request -- PROBE ' + request;
                }
            };
        connect(connector, me);
        return me;
    },
    make_connector = function () {
        var value = false,
            informant = false,
            constraints = [],
            set_my_value = function (newval, setter) {
                if (!has_value(me)) {
                    value = newval;
                    informant = setter;
                    return for_each_except(setter, inform_about_value,
                                           constraints);
                }
                if (value !== newval) {
                    throw '設定済み: ' + [value, newval];
                }
                return 'ignored';
            },
            forget_my_value = function (retractor) {
                var ary = constraints.slice();
                if (retractor === informant) {
                    informant = false;
                    return for_each_except(retractor, inform_about_no_value,
                                           ary);
                }
                return 'ignored';
            },
            connect = function (new_constraint) {
                if (constraints.indexOf(new_constraint) === -1) {
                    constraints.unshift(new_constraint);
                }
                if (has_value(me)) {
                    inform_about_value(new_constraint);
                }
                return 'done';
            },
            me = function (request) {
                switch (request) {
                    case 'has_value':
                        return informant ? true : false;
                    case 'value':
                        return value;
                    case 'set_value':
                        return set_my_value;
                    case 'forget':
                        return forget_my_value;
                    case 'connect':
                        return connect;
                    default:
                        throw 'Unknown operation -- CONNECTOR ' + request;
                }
            };
        return me;
    },
    c_add = function (x, y) {
        var z = make_connector();
        adder(x, y, z);
        return z;
    },
    c_sub = function (x, y) {
        var z = make_connector();
        adder(y, z, x);
        return z;
    },
    c_mul = function (x, y) {
        var z = make_connector();
        multiplier(x, y, z);
        return z;
    },
    c_div = function (x, y) {
        var z = make_connector();
        multiplier(y, z, x);
        return z;
    },
    c_v = function (value) {
        var x = make_connector();
        constant(value, x);
        return x;
    };

var celsius_fahrenheit_converter = function (x) {
        return c_add(c_mul(c_div(c_v(9), c_v(5)), x), c_v(32));
    },
    c = make_connector(),
    f = celsius_fahrenheit_converter(c),
    i = 'kamimura';

probe('celsius', c);
probe('fahrenheit', f);    
