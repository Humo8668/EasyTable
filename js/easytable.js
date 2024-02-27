
function isDef(obj) {
  return (typeof obj !== 'undefined');
}

function isNull(obj) {
  return (typeof obj !== 'undefined' && obj == null);
}

function isDOMElement(obj) {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLElement;
  }
  catch(e){
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (typeof obj==="object") &&
      (obj.nodeType===1) && (typeof obj.style === "object") &&
      (typeof obj.ownerDocument ==="object");
  }
}

function isString(obj) {
  return (typeof obj === 'string');
} 

function isEmptyString(obj) {
  return (typeof obj === 'string' &&  obj.length == 0 ||  obj == null);
}

function nvl(value, defaultValue) {
  return (isDef(value)&&!isNull(value))?value:defaultValue;
}

function getFormData(form) {
  var result = {};

  var inputs = form.getElementsByTagName("input");
  var selects = form.getElementsByTagName("select");
  var textareas = form.getElementsByTagName("textarea");

  for(var i = 0; i < inputs.length; i++){
    if(typeof result[inputs[i].name] === 'undefined')
      result[inputs[i].name] = inputs[i].value;
    else if (result[inputs[i].name] instanceof Array)
      result[inputs[i].name].push(inputs[i].value);
    else{
      result[inputs[i].name] = [result[inputs[i].name]];
      result[inputs[i].name].push(inputs[i].value);
    }
  }

  for(var i = 0; i < selects.length; i++)
    result[selects[i].name] = selects[i].value;

  for(var i = 0; i < textareas.length; i++)
    result[textareas[i].name] = textareas[i].value;

  return result;
}

function clearFormInputs(form) {
  console.log("Clear the filter!");
  var inputs = form.getElementsByTagName("input");
  var selects = form.getElementsByTagName("select");
  var textareas = form.getElementsByTagName("textarea");

  for(var i = 0; i < inputs.length; i++){
    inputs[i].value = "";
  }

  for(var i = 0; i < selects.length; i++)
    selects[i].value = "";

  for(var i = 0; i < textareas.length; i++)
    textareas[i].value = "";
}

function removeAllChilds(DOM) {
  while (DOM.firstChild) {
    DOM.removeChild(DOM.firstChild);
  }
}

function createDOM(tagName, attributes, innerText) {
  var dom = document.createElement(tagName);
  if(isDef(attributes)) {
    for(var attr in attributes) {
      dom.setAttribute(attr, attributes[attr]);
    }
  }
  if(isDef(innerText))
    dom.innerText = innerText
  return dom;
}

function getTableManager(){
  if(typeof document.TableManager !== 'undefined') {
    return document.TableManager;
  } else {
    document.TableManager = {
      tables: {},
      getTable: function(tableName) {
        if(isString(tableName) && !isEmptyString(tableName))
          return this.tables[tableName];
        return null;
      },
      registerTable: function(tableName, tableObject) {
        if(!isString(tableName) || isEmptyString(tableName)) {
          return;
        }
        this.tables[tableName] = tableObject;
      },
      getTablesArray: function () {
        var tablesArray = [];
        for(var tbl in this.tables) {
          tablesArray.push(this.tables[tbl]);
        }
        return tablesArray;
      }
    };
    return document.TableManager;
  }
}

var ORDERS = {
  DEFAULT: 0,
  ASC: 1,
  DESC: -1
};

function getNextOrdering(currOrdering) {

  if(currOrdering == ORDERS.DEFAULT || typeof currOrdering === 'undefined') {
    return ORDERS.ASC;
  } else if (currOrdering == ORDERS.ASC) {
    return ORDERS.DESC;
  } else if (currOrdering == ORDERS.DESC) {
    return ORDERS.ASC;
  } else { // keeping code complainable 
    return ORDERS.ASC;
  }

  /*if(currOrdering == ORDERS.DEFAULT || typeof currOrdering === 'undefined') {
    return ORDERS.ASC;
  } else if (currOrdering == ORDERS.ASC) {
    return ORDERS.DESC;
  } else if (currOrdering == ORDERS.DESC) {
    return ORDERS.DEFAULT;
  } else { // keeping code complainable 
    return ORDERS.DEFAULT;
  }*/
}

function Sort(objArray, comparatorFunc) {
  for(var i = 0; i < objArray.length; i++) {
    for(var j = 0; j < objArray.length-i-1; j++) {
      if(comparatorFunc(objArray[j], objArray[j+1]) > 0) {
        var obj = objArray[j];
        objArray[j] = objArray[j+1];
        objArray[j+1] = obj;
      }
    }
  }
}

function equalsIgnoreCase(str1, str2) {
  if(typeof str1 !== 'string' || typeof str2 !== 'string') {
    return false;
  }

  return (new String(str1)).trim().toLowerCase() == (new String(str2)).trim().toLowerCase();
}

function parseFunction(funcStr) {
  if(typeof funcStr !== 'function')
    return eval(funcStr.substr(0, funcStr.indexOf('(')));
  else
    return funcStr;
}


function Table(tableDefinition) {
  this.tableDef = tableDefinition;
  this.tableBuilder = new TableBuilder(this.tableDef.DOM, this);
  this.data = [];
  this.selectedRowDOM = null;
  this.DEFAULT_PAGING = {
    totalPages: 0,
    totalElements: 0,
    page: 0,
    size: 20,
    sort: []
  };
  
  this.paging = this.DEFAULT_PAGING;
  this.filter = [];

  getTableManager().registerTable(this.tableDef.name, this);

  try {
    this.tableDef.getData = parseFunction(this.tableDef.getData);
    this.tableDef.onRowSelect = parseFunction(this.tableDef.onRowSelect);
    this.tableDef.onRowDblClick = parseFunction(this.tableDef.onRowDblClick);
  } catch(e) {
    throw "Couldn't parse function name: " + e;
  }

  this.getModalName = function() {
    return this.tableDef.name + "_filterModal";
  }

  this.refreshData = function () {
    var onDataReceived = function(result) {
      result.sort.forEach((sort) => {
        sort.order = (equalsIgnoreCase(sort.order, "ASC"))?ORDERS.ASC:ORDERS.DESC;
      });
      this.paging = {
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        page: result.page,
        size: result.size,
        sort: result.sort,
      }
      this.data = result.data;
      this.redraw();
    };
    this.tableDef.getData(this.paging, this.filter, onDataReceived.bind(this));
  }

  this.draw = function() {
    this.tableBuilder.build(this);
    this._afterBuilt();
  }

  this.redraw = function() {
    this.tableBuilder.refresh(this);
  }


  this.onPagingChanged = function(paging){
    console.log("onPagingChanged - " + JSON.stringify(paging));
    this.paging = paging;
    this.refreshData();
  }


  this.onPageChanged = function(pageNum) {
    console.log("onPageChanged - " + pageNum);
    this.paging.page = pageNum;
    this.onPagingChanged(this.paging);
  }


  this.onPageSizeChanged = function(pageSize) {
    console.log("onPageSizeChanged - " + pageSize);
    this.paging.size = pageSize;
    this.onPagingChanged(this.paging);
  }


  this.onRefresh = function() {
    console.log("onRefresh");
    this.refreshData();
  }


  this.onRowSelected = function(rowDOM) {
    //console.log("onRowSelected", rowDOM);
    if(rowDOM == this.selectedRowDOM)
      return;

    rowDOM.setAttribute("active", true);
    rowDOM.classList.add("active");
    if(this.selectedRowDOM != null) {
      this.selectedRowDOM.removeAttribute("active");
      this.selectedRowDOM.classList.remove("active");
    }
    this.selectedRowDOM = rowDOM;
    this.tableDef.onRowSelect(this.data[rowDOM.getAttribute("data-index")]);
  }

  this.onRowDblClick = function(rowDOM) {
    this.tableDef.onRowDblClick(this.data[rowDOM.getAttribute("data-index")]);
  }


  this.getSelectedRow = function() {
    return this.selectedRowDOM;
  }


  this.getSelectedRowData = function() {
    if(typeof this.selectedRowDOM === 'undefined' || this.selectedRowDOM == null)
      return {};
    
    var TDs = this.selectedRowDOM.getElementsByTagName("td");
    var row = {};
    for(var i = 0; i < TDs.length; i++) {
      var key = TDs[i].getAttribute("name");
      if(typeof key !== 'undefined' && key != null) 
        row[key] = TDs[i].innerText;
    }
    return row;
  }

  this.changeOrdering = function(column) {
    console.log("changeOrdering - ", column);
    var sortObj = undefined;
    this.paging.sort.forEach((sort) => {
      if(sort.field == column) {
        sortObj = sort;
      }
    });

    if(!isDef(sortObj)) {
      sortObj = {
        field: column,
        order: ORDERS.ASC
      };
      this.paging.sort.push(sortObj);
    } else {
      sortObj.order = getNextOrdering(sortObj.order);
    }
    // *****************
    this.tableBuilder.order(sortObj);
    // *****************
    this.tableBuilder.refreshOrderIcons();
  }

  this.applyFilter = function (filterData) {
    console.log("onFilter ", filterData);
    this.filter = [];
    for(var columnName in filterData) {
      if(isEmptyString(filterData[columnName])) continue;
      if(Array.isArray(filterData[columnName]) && !isDef(filterData[columnName].find((x)=>!isEmptyString(x)))) {
        continue;
      }
      var column = this.tableDef.columns.find((x) => x.name==columnName);
      if(!isDef(column)) {
        continue;
      }
      var operator = nvl(column.filter.operator, "=");
      this.filter.push({column: columnName, value: filterData[columnName], operator: operator});
    }
    console.log(this.filter);
    this.refreshData();
  }

  this._afterBuilt = function() {}
}



function TableDefinitionParser() {
  this.TABLE_TAG_NAME = "eztable";
  this.COLUMN_TAG_NAME = "column";
  this.FILTER_TAG_NAME = "filter";

  this.parseFilterTag = function(filterTagDOM, parser) {
    var filter = {
      DOM: filterTagDOM,
      label: filterTagDOM.getAttribute("label"),
      operator: filterTagDOM.getAttribute("operator"),
      options: filterTagDOM.getAttribute("options")
    };
    return filter;
  }


  this.parseColumnTag = function(columnTagDOM, parser) {
    var column = {
      DOM: columnTagDOM,
      name: columnTagDOM.getAttribute("name"),
      title: columnTagDOM.getAttribute("title"),
      format: columnTagDOM.getAttribute("format"),
      hidden: columnTagDOM.hasAttribute("hidden")
    };
    columnTagDOM.childNodes.forEach(function(childDOM) {
      if(new String(childDOM.tagName).toLowerCase() !== parser.FILTER_TAG_NAME) return;
      column.filter = parser.parseFilterTag(childDOM, parser);
    });
    return column;
  }


  this.parseTableTag = function (tableTagDOM, parser) {
    var table = {
      DOM: tableTagDOM,
      name: tableTagDOM.getAttribute("name"),
      getData: tableTagDOM.getAttribute("getData"),
      enableNum: tableTagDOM.getAttribute("enableNumeration") === 'true',
      onRowSelect: tableTagDOM.getAttribute("onRowSelect"),
      onRowDblClick: tableTagDOM.getAttribute("onRowDblClick"),
      columns: []
    };
    tableTagDOM.childNodes.forEach(function(childDOM) {
      if(new String(childDOM.tagName).toLowerCase() !== parser.COLUMN_TAG_NAME) return;
      table.columns.push(parser.parseColumnTag(childDOM, parser));
    });
    return table;
  }

  this.parse = function() {
    var tableTags = document.getElementsByTagName(this.TABLE_TAG_NAME);
    var tables = [];
    for(var i = 0; i < tableTags.length; i++) {
      tables.push(this.parseTableTag(tableTags[i], this));
    }
    return tables;
  }
}



function TableBuilder(parentDOM, table) {
  this.parentDOM = parentDOM;
  this.table = table;
  this.tableDOM = null;  
  this.tableBodyDOM = null;
  this.tableHeadDOM = null;
  this.paginationBlockDOMs = [];
  this.tableControlDOMs = [];
  this.modalFilterFormDOM = null;

  this.PAGINATION_BLOCK_CLASS = "pagination-block";
  this.TABLE_CONTROLS_CLASS = "tableControls";
  this.PAGE_SIZE_INPUT_NAME = "pageSize";

  this.buildPagination = function() {
    var buttonToolbar = createDOM("div", {class: "btn-toolbar justify-content-center", role: "toolbar"});
    var buttonGroup = createDOM("div", {class: "btn-group mr-2 " + this.PAGINATION_BLOCK_CLASS, role: "group"});
    this.paginationBlockDOMs.push(buttonGroup);
    if(this.table.paging.totalPages > 0) {
      for(var i = 0; i < table.paging.totalPages; i++) {
        var button = createDOM(
          "button", 
          {
            "type": "button", 
            "class": "btn btn-secondary " + ((i==this.table.paging.page)?"acvite":""),
            "onclick": function() { this.table.onPageChanged(i) }
          },
          i+1+'');
        buttonGroup.appendChild(button);
      }
    } else {
      var button = createDOM(
        "button", 
        {
          "type": "button", 
          "class": "btn btn-secondary",
          "disabled": "true",
          "onclick": function() { this.table.onPageChanged(i) }
        },
        "1");
      buttonGroup.appendChild(button);
    }
    buttonToolbar.appendChild(buttonGroup);
    parentDOM.appendChild(buttonToolbar);
  }


  this.buildTableControls = function() {
    var structuralTable = createDOM("table", {class: this.TABLE_CONTROLS_CLASS});
    this.tableControlDOMs.push(structuralTable);
    var tr = createDOM("tr");
    structuralTable.appendChild(tr);
    // ***********************
    var td1 = createDOM("td");
    var inputGroup = createDOM("div", {class: "input-group"});
    var inputGroupPrepend = createDOM("div", {class: "input-group-prepend"});
    var inputGroupPrependText = createDOM("span", {class: "input-group-text", id: "rows-in-page-label"});
    var inputGroupPrependIcon = createDOM("i", {class: "fa fa-solid fa-list-ol"});
    inputGroupPrependText.appendChild(inputGroupPrependIcon);
    inputGroupPrepend.appendChild(inputGroupPrependText);
    inputGroup.appendChild(inputGroupPrepend);
    var rowsInPageInput = createDOM("input", {
      class: "form-control",
      name: this.PAGE_SIZE_INPUT_NAME,
      type: "number",
      placeholder: "Number of rows in page",
      "aria-describedby": "rows-in-page-label",
      label: "Number of rows in page",
      value: this.table.paging.size,
      style: "text-align: right;"
    });
    rowsInPageInput.table = this.table;
    rowsInPageInput.addEventListener("keydown", (e) => {
      if(equalsIgnoreCase(e.key, "Enter")) {
        this.table.onPageSizeChanged(e.currentTarget.value);
      }
    });
    inputGroup.appendChild(rowsInPageInput);
    td1.appendChild(inputGroup);
    structuralTable.appendChild(td1);
    // **************************
    var td2 = createDOM("td");
    var refreshBtn = createDOM("button", {
      id: "btnRefresh",
      class: "btn btn-dark"
    });
    refreshBtn.table = this.table;
    refreshBtn.onclick = function () { this.table.onRefresh(table) };
    var refreshBtnIcon = createDOM("i", {
      class: "fa fa-arrows-rotate"
    });
    refreshBtn.appendChild(refreshBtnIcon);
    var refreshBtnText = createDOM("span", {}, "  Refresh");
    refreshBtn.appendChild(refreshBtnText);
    td2.appendChild(refreshBtn);
    structuralTable.appendChild(td2);
    // **************************
    var td3 = createDOM("td");
    var filterBtn = createDOM("button", {
      id: "btnFilter",
      class: "btn " + ((Object.entries(this.table.filter).length>0)?"btn-info":"btn-dark"),
      type: "button",
      "data-toggle": "modal",
      "data-target": "#"+this.table.getModalName()
    });
    var filterBtnIcon = createDOM("i", {class: "fa fa-filter"});
    filterBtn.appendChild(filterBtnIcon);
    var filterBtnText = createDOM("span", {}, "  Filter");
    filterBtn.appendChild(filterBtnText);
    td3.appendChild(filterBtn);
    structuralTable.appendChild(td3);
    // **************************
    parentDOM.appendChild(structuralTable);
  }


  this.buildTableWithData = function() {
    var tableDef = this.table.tableDef;

    this.tableDOM = createDOM("table", {
      class: "table table-striped table-bordered table-hover table-sm",
      id: "tableId"
    });
    var captionDOM = createDOM("caption", {}, "Overall: " + this.table.data.length + " rows");
    this.tableDOM.appendChild(captionDOM);
    this.tableHeadDOM = createDOM("thead", { class: "thead-dark"});
    var theadRowDOM = createDOM("tr");
    if(tableDef.enableNum) {
      let theadCol = createDOM("th", {scope: "col", name: "numeration", type: "number"});
      theadRowDOM.appendChild(theadCol);
    }
    for(var i = 0; i < tableDef.columns.length; i++) {
      let column = tableDef.columns[i];
      if(column.hidden) continue;
      let theadCol = createDOM("th", {
        scope: "col",
        name: column.name,
        type: column.format
      }, column.title);
      theadCol.table = this.table;
      theadCol.addEventListener("click", function(e) { this.table.changeOrdering(e.currentTarget.getAttribute("name")); });
      theadRowDOM.appendChild(theadCol);
    }

    this.tableHeadDOM.appendChild(theadRowDOM);
    this.tableDOM.appendChild(this.tableHeadDOM);
    this.tableBodyDOM = createDOM("tbody");
    this.tableDOM.appendChild(this.tableBodyDOM);
    parentDOM.appendChild(this.tableDOM);
  }

  function buildFilterInputGroup(columnName, inputFormat, filterOperator, filterValue, optionObjectsArray) {
    var OPERATORS = {
      LIKE: 'like',
      RANGE: 'range',
      EQUAL: '=',
      GREATER: '>',
      LESS: '<',
      OPTION: 'option'
    }
    
    var inputGroup = createDOM("div", {class: "col-8 input-group"});
    if(!isDef(filterOperator) || isEmptyString(filterOperator)) filterOperator = OPERATORS.EQUAL;
    if(!isDef(inputFormat) || isEmptyString(inputFormat)) inputFormat = "text";
    if(!isDef(filterValue)) filterValue = "";
    filterOperator = filterOperator.toLowerCase();
    if(filterOperator.indexOf(OPERATORS.LIKE) >= 0) {
      var inputGroupPrepend = createDOM("div", {class: "input-group-prepend"});
      var inputGroupPrependText = createDOM("div", {class: "input-group-text"}, OPERATORS.LIKE);
      var inputFilter = createDOM("input", {
        name: columnName,
        id: columnName,
        class: "form-control",
        type: 'text',
        value: filterValue
      });
      inputGroupPrepend.appendChild(inputGroupPrependText);
      inputGroup.appendChild(inputGroupPrepend);
      inputGroup.appendChild(inputFilter);
    } else if(filterOperator.indexOf(OPERATORS.RANGE) >= 0) {
      if(inputFormat.indexOf('number') < 0 && inputFormat.indexOf('date') < 0) {
        throw 'Incopatible input format for filter <' + filterOperator + '>';
      }
      filterOperator = OPERATORS.RANGE;
      var firstPrepend = createDOM("div", {class: "input-group-prepend"});
      var firstPrependText = createDOM("div", {class: "input-group-text"}, 'between');
      var secondPrepend = createDOM("div", {class: "input-group-prepend"});
      var secondPrependText = createDOM("div", {class: "input-group-text"}, 'and');
      var fromInput = createDOM("input", {
        name: columnName,
        id: columnName,
        class: "form-control",
        type: inputFormat,
        value: ((isDef(filterValue)&&isDef(filterValue[0]))?filterValue[0]:"")
      });
      var toInput = createDOM("input", {
        name: columnName,
        id: columnName,
        class: "form-control",
        type: inputFormat,
        value: ((isDef(filterValue)&&isDef(filterValue[1]))?filterValue[1]:"")
      });
      
      firstPrepend.appendChild(firstPrependText);
      secondPrepend.appendChild(secondPrependText);

      inputGroup.appendChild(firstPrepend);
      inputGroup.appendChild(fromInput);
      inputGroup.appendChild(secondPrepend);
      inputGroup.appendChild(toInput);
    } else if(filterOperator == OPERATORS.EQUAL 
          || filterOperator == OPERATORS.GREATER 
          || filterOperator == OPERATORS.LESS) {
      if(inputFormat.indexOf('number') < 0) {
        throw 'Incopatible input format for filter';
      }
      var inputGroupPrepend = createDOM("div", {class: "input-group-prepend"});
      var inputGroupPrependText = createDOM("div", {class: "input-group-text"}, filterOperator);
      var inputFilter = createDOM("input", {
        name: columnName,
        id: columnName,
        class: "form-control"
      });
      inputGroupPrepend.appendChild(inputGroupPrependText);
      inputGroup.appendChild(inputGroupPrepend);
      inputGroup.appendChild(inputFilter);
    } else if(filterOperator.indexOf(OPERATORS.OPTION) >= 0) {
      filterOperator = OPERATORS.OPTION;
      var inputGroupPrepend = createDOM("div", {class: "input-group-prepend"});
      var inputGroupPrependText = createDOM("div", {class: "input-group-text"}, OPERATORS.OPTION);
      var selectDOM = createDOM("select", {
        name: columnName,
        id: columnName,
        class: "form-control"
      });
      optionObjectsArray.push({name: "** Select options", value: ""});
      for(var i = 0; i < optionObjectsArray.length; i++) {
        var optionAttributes = {
          value: optionObjectsArray[i].value
        };
        if(optionObjectsArray[i].value == filterValue) {
          optionAttributes.selected = true;
        }
        var optionDOM = createDOM("option", optionAttributes, optionObjectsArray[i].name);
        selectDOM.appendChild(optionDOM);
      }
      inputGroupPrepend.appendChild(inputGroupPrependText);
      inputGroup.appendChild(inputGroupPrepend);
      inputGroup.appendChild(selectDOM);
    }
    
    return inputGroup;
  }

  this.buildFilterModal = function() {
    var tableDef = this.table.tableDef;
    var modalDOM = createDOM("div", {
      class: "modal fade",
      id: this.table.getModalName(),
      tabindex: "-1",
      role: "dialog",
      "aria-hidden": "true"
    });
    var modalDialogDivDOM = createDOM("div", {class: "modal-dialog modal-dialog-centered modal-lg"});
    var modalDialogContentDOM = createDOM("div", {class: "modal-content"});
    // ******************* HEADER *******************
    var modalHeaderDOM = createDOM("div", {class: "modal-header"});
    var modalTitleDOM = createDOM("h5", {class: "modal-title"}, "Filter");
    modalHeaderDOM.appendChild(modalTitleDOM);
    var modalClearBtnDOM = createDOM("button", {
      type: "button", 
      class: "btn btn-dark"
    }, "Clear filters");
    modalClearBtnDOM.addEventListener("click", function(e) {clearFormInputs(modalFilterFormDOM);});
    modalHeaderDOM.appendChild(modalClearBtnDOM);
    modalDialogContentDOM.appendChild(modalHeaderDOM);
    // ******************* BODY *******************
    var modalBodyDOM = createDOM("div", {class: "modal-body"});
    var modalFilterFormDOM = createDOM("form", {name: tableDef.name + "-filter-form", id: tableDef.name+"_table-filter-form"});
    this.modalFilterFormDOM = modalFilterFormDOM;
    tableDef.columns.forEach((column) => {
      if(!isDef(column.filter))
        return;
      var filterDef = column.filter;
      var inputRow = createDOM("div", {class: "form-group row"});
      var label = createDOM("label", {class: "col-4 col-form-label"}, (filterDef.label != null)?filterDef.label:column.title);
      var inputGroup = buildFilterInputGroup(column.name, column.format, nvl(filterDef.operator, ""), this.table.filter[column.name], eval(filterDef.options));
      inputRow.appendChild(label);
      inputRow.appendChild(inputGroup);
      modalFilterFormDOM.appendChild(inputRow);
    });
    modalBodyDOM.appendChild(modalFilterFormDOM);
    modalDialogContentDOM.appendChild(modalBodyDOM);
    // ******************* FOOTER *******************
    var modalFooterDOM = createDOM("div", {class: "modal-footer"});
    var modalCloseBtn = createDOM("button", {
        type: "button", 
        class: "btn btn-secondary", 
        "data-dismiss": "modal"
      }, "Close");
    var modalFilterBtn = createDOM("button", {
      type: "button",
      class: "btn btn-primary",
      "data-dismiss": "modal"
    }, "Filter");
    modalFilterBtn.table = this.table;
    modalFilterBtn.addEventListener("click", (e) => {
      this.table.applyFilter(getFormData(modalFilterFormDOM));
    });
    modalFooterDOM.appendChild(modalCloseBtn);
    modalFooterDOM.appendChild(modalFilterBtn);
    modalDialogContentDOM.appendChild(modalFooterDOM);
    // **********************************************************
    modalDialogDivDOM.appendChild(modalDialogContentDOM);
    modalDOM.appendChild(modalDialogDivDOM);
    parentDOM.appendChild(modalDOM);
  }

  this.build = function () {
    this.buildPagination();
    this.buildTableControls();
    this.buildTableWithData();
    this.buildPagination();
    this.buildFilterModal();
    return table;
  }

  this.refresh = function() {
    function refreshTableData() {
      if(!isDef(this.tableBodyDOM)) {
        this.tableBodyDOM = this.tableDOM.getElementsByTagName("tbody")[0];
      }
      var tableBody = this.tableBodyDOM;
      removeAllChilds(tableBody);
  
      if(this.table.data.length == 0) {
        var tr = createDOM("tr", {colspan: this.table.tableDef.columns.length + ((this.table.tableDef.enableNum)?1:0)}, "No data");
        tableBody.appendChild(tr);
      } else {
        for(var i = 0; i < this.table.data.length; i++) {
          var tableRow = createDOM("tr", {"data-index": i});
          tableRow.table = this.table;
          tableRow.addEventListener("click", function(e) { this.table.onRowSelected(e.currentTarget); });
          tableRow.addEventListener("dblclick", function(e) { this.table.onRowDblClick(e.currentTarget); });
          if(this.table.tableDef.enableNum) {
            var tableCell = createDOM("td", {
              name: "numeration"
            }, i+1);
            tableRow.appendChild(tableCell);
          }
          for(var j = 0; j < this.table.tableDef.columns.length; j++) {
            if(this.table.tableDef.columns[j].hidden)
              continue;
            var colName = this.table.tableDef.columns[j].name;
            var tableCell = createDOM("td", {name: colName}, this.table.data[i][colName]);
            tableRow.appendChild(tableCell);
          }
          tableBody.appendChild(tableRow);
        }
      }
      this.refreshOrderIcons();
      this.tableDOM.getElementsByTagName("caption")[0].innerText = "Overall: "+ table.paging.totalElements + " rows";
    }
    function refreshPaginations() {
      if(!isDef(this.paginationBlockDOMs)) {
        this.paginationBlockDOMs = this.table.tableDef.DOM.parentElement.getElementsByClassName(this.PAGINATION_BLOCK_CLASS);
      }
      for(var i = 0; i < this.paginationBlockDOMs.length; i++) {
        var paginationBlock = this.paginationBlockDOMs[i];
        removeAllChilds(paginationBlock);
        if(this.table.paging.totalPages > 0) {
          for(var page = 0; page < this.table.paging.totalPages; page++) {
            var button = createDOM(
              "button", 
              {
                "type": "button", 
                "class": "btn btn-secondary " + ((page==this.table.paging.page)?"active":""),
                "aria-pressed" : (page==this.table.paging.page),
                "pageNum": page
              },
              page+1+'');
            button.table = this.table;
            button.addEventListener("click", function() { this.table.onPageChanged(this.getAttribute("pageNum")); });
            paginationBlock.appendChild(button);
          }
        } else {
          var button = createDOM(
            "button", 
            {
              "type": "button", 
              "class": "btn btn-secondary",
              "disabled": "true"
            },
            "1");
          paginationBlock.appendChild(button);
        }
      }
    }
    function refreshTableControls() {
      for(var i = 0; i < this.tableControlDOMs.length; i++) {
        var tableControlDOM = this.tableControlDOMs[i];
        var inputs = tableControlDOM.getElementsByTagName("input");
        for(var j = 0; j < inputs.length; j++) {
          if(equalsIgnoreCase(inputs[j].getAttribute("name"), this.PAGE_SIZE_INPUT_NAME)) {
            inputs[j].value = this.table.paging.size;
          }
        }
      }
    }
    refreshTableData.bind(this)();
    refreshPaginations.bind(this)();
    refreshTableControls.bind(this)();
  }

  this.order = function(sortObj) {
    var arr = [];
    var rowsDOM = this.tableBodyDOM.getElementsByTagName("tr");
    // for each row
    for (var i = 0; i < rowsDOM.length; i++) {
      // for each cell in row
      for (var j = 0; j < rowsDOM[i].children.length; j++) {
        var colName = rowsDOM[i].children[j].getAttribute('name');
        if(equalsIgnoreCase(colName, sortObj.field)) {
          var value = rowsDOM[i].children[j].textContent;
          if(equalsIgnoreCase(this.table.tableDef.columns.find((x) => x.name==colName).format, 'number')) {
            value = value.replace(' ', '') - 0;
          }
          arr.push({
            value: value,
            td: rowsDOM[i].children[j],
            tr: rowsDOM[i]
          });
        }
      }
    }
    Sort(arr, function(left, right) {
      if(left.value > right.value) {
        return 1 * sortObj.order;
      } else if(left.value < right.value) {
        return -1 * sortObj.order;
      } else {
        return 0;
      }
    });
    for(var i = 0; i < arr.length; i++) {
      this.tableBodyDOM.appendChild(arr[i].tr); // Cannot be two same DOM-Nodes in one DOM element. So when existing node re-added, first will be deleted.
    }
  }

  this.refreshOrderIcons = function() {
    var columns = this.tableHeadDOM.getElementsByTagName("th");
    for(var i = 0; i < columns.length; i++) {
      var colName = columns[i].getAttribute("name");
      if(typeof colName === 'undefined')
        continue;

      if(typeof columns[i].getElementsByTagName("i")[0] !== 'undefined')
        columns[i].removeChild(columns[i].getElementsByTagName("i")[0]);
      this.table.paging.sort.forEach((sort) => {
        if(equalsIgnoreCase(sort.field, colName)) {
          var icon = document.createElement("i");
          if(sort.order == ORDERS.ASC)
            icon.setAttribute("class", "fa fa-sort-up");
          else if(this.table.paging.sort.find((x)=> x.field == colName).order == ORDERS.DESC)
            icon.setAttribute("class", "fa fa-sort-down");
          else
            return;

          columns[i].appendChild(icon);
        }
      });
    }
  }
}

function onPageLoad() {
  var tableDefParser = new TableDefinitionParser();
  var tableDefs = tableDefParser.parse();
  console.log(tableDefs);
  for(var i = 0; i < tableDefs.length; i++) {
    var table = new Table(tableDefs[i]);
    table.draw();
  }
  var tables = getTableManager().getTablesArray();
  for(var i = 0; i < tables.length; i++) {
    let table = tables[i];
    table.refreshData();
  }
}


window.addEventListener("load", onPageLoad);