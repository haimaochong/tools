/**
 * 封装列表组件jqGrid
 * auth:lihh
 * 
 * 功能：
 * 1.initGrid // 普通列表
 * 2.initPageGrid // 翻页列表
 * 3.userAuth // 用户权限控制
 *  
 * 默认参数： 
 * datatype:'json'
 * mtype:'POST'
 * i18n:'zh-cn'
 * height:'auto'
 * autowidth:true
 * rownumbers:true
 * rownumWidth:80
 * rowNum:999999999 // 由于-1会造成使用data批量加载本地数据出错，因此此处修正为999999999
 * multiselectOrRN：false // 序号和多选框同时展示一列
 * multiselectOrRNWidth：80
 * altRows:true // 表格隔行换色
 * loadui:'Disable' // 隐藏jqGrid自带的'加载中'字样
 * prmNames:{sort:'sortField',order:'sortOrder'}
 * 
 * 1.initGrid
 * 参数说明：
 * 	引用默认参数
 * 
 * 事例：
 * $('#shopTable').initGrid({
		url: services.QUERY_SHOPS,
			colNames: ['ID', '店铺名称', '部门名称', '结算公司', '所属平台', "当前渠道等级", "申请等级<br/>申请状态", "操作"],
	        colModel: [
	                   { name: 'id', index: 'id', hidden:true},
	                   { name: 'name', index: 'name', width:133,
	                	   formatter : function(cellvalue, options, rowObejct) {
	                		   return '<a href="javascript:void(0)" class="blue js-lookDetail">'+cellvalue+'</a>';
	                	   }},
	                   { name: 'department', index: 'department', sortable:false, width:133},
	                   { name: 'companyDis', index: 'companyDis', sortable:false, width:133},
	                   { name: 'platformName', index: 'platformName', sortable:false, width:133}
	        ]
		});
 * 
 * 
 * 2.initPageGrid
 * 参数说明：
 * 	除默认参数外，其他额外默认参数：
 * viewrecords：true
 * rowNum:20
 * rowList:[ 20, 50, 100 ]
 * prmNames:{sort:'sortField',order:'sortOrder',page:'pageIndex',rows:'pageSize'}
 * pager:'pageDIV'
 * 
 * 事例：
 * $('#shopTable').initPageGrid({
		url: services.QUERY_SHOPS,
			colNames: ['ID', '店铺名称', '部门名称', '结算公司', '所属平台', "当前渠道等级", "申请等级<br/>申请状态", "操作"],
	        colModel: [
	                   { name: 'id', index: 'id', hidden:true},
	                   { name: 'name', index: 'name', width:133,
	                	   formatter : function(cellvalue, options, rowObejct) {
	                		   return '<a href="javascript:void(0)" class="blue js-lookDetail">'+cellvalue+'</a>';
	                	   }},
	                   { name: 'department', index: 'department', sortable:false, width:133},
	                   { name: 'companyDis', index: 'companyDis', sortable:false, width:133},
	                   { name: 'platformName', index: 'platformName', sortable:false, width:133}
	        ]
		});
 * 
 * 
 * 3.userAuth
 * 说明：
 * 	使用该控制需要在jsp页面增加权限控制的div
 * 例如：
 * 	<!-- 权限控制 -->
	<div style="display: none" id="userAuthDiv">
		<shiro:hasPermission name="ShopController:authorize">
			<div id="ShopController:authorize"></div>
		</shiro:hasPermission>
		<shiro:hasPermission name="ShopController:level">
			<div id="ShopController:level"></div>
		</shiro:hasPermission>
	</div>
 * 
 * 而后在js中可用$.inArray("ShopController:level", userAuth) >= 0判断是否含有该权限
 * 
 */

/**
 * 列表封装
 */
(function($) {
	var _jqGrid = (function() {
		window.allRequestLoading = [];
		// 默认参数
		var options = {
				datatype : "json",
				mtype : 'POST',
				i18n : 'zh-cn',
				height : "auto",
				autowidth: true,
				multiselectOrRN: false,
				multiselectOrRNWidth: 80,
				rownumbers:true,
				rownumWidth: 80,
				altRows : true,
				rowNum : 999999999,
				prmNames:{sort:'sortField',order:'sortOrder'},
				loadui:"Disable",
				loadingObj: null, // 加载时实现全屏覆盖功能
				initLoading: function() {
					var loadingObj = layer.load(1, {
						shade: [0.7,'#fff']
					});
					allRequestLoading.push(loadingObj);
					$(this).jqGrid("setGridParam", {loadingObj:loadingObj});
				},
				destroyLoading: function() {
					var loadingObj = $(this).jqGrid("getGridParam", "loadingObj");
					loadingObj ? allRequestLoading.splice(allRequestLoading.indexOf(loadingObj), 1) : null;
					if(allRequestLoading.length < 1) layer.closeAll("loading");
				},
				initMultiselectOrRN: function(rowid) {
					var conf = this.p;
					var preDataNum = (conf.rowNum<0?0:conf.rowNum)*(conf.page-1);
					var ids = $(this).jqGrid('getDataIDs');
					var rowNum = ($.inArray(rowid, ids)+1);
					$("#"+rowid).find("td[aria-describedby="+conf.id+"_cb]").append("<span style='margin-left:10px;'>" + (preDataNum+rowNum) + "</span>");
				}
		},
		extendConf = function (defaultConf, conf) {
			var config = $.extend({}, defaultConf, conf);
			config.beforeRequest = function() {
				defaultConf.initLoading.apply(this);
				conf.beforeRequest ? conf.beforeRequest.apply(this):null;
			};
			config.gridComplete = function() {
				defaultConf.destroyLoading.apply(this);
				defaultConf.destroyLoading();
				conf.gridComplete ? conf.gridComplete.apply(this):null;
			};
			
			if(config.multiselectOrRN) {
				config.rownumbers = false;
				config.multiselect = true;
				config.multiselectWidth = config.multiselectOrRNWidth || defaultConf.multiselectOrRNWidth;
				config.afterInsertRow = function(rowid, record, ele) {
					defaultConf.initMultiselectOrRN.apply(this, arguments);
					conf.afterInsertRow ? conf.afterInsertRow.call(this, arguments):null;
				};
			}
			return config;
		},
		support_event = function() {
			// 调整大小以适应页面大小
			var ele = this;
			$(window).resize(function() {
				var width = $("#gbox_"+ele.p.id).parent().width();
				$(ele).jqGrid('setGridWidth', width);
			});
		},
		grid = function(conf) {
			var ele = $(this)[0];
			var config = extendConf.call(ele, $.extend({}, options), conf);
			$(this).jqGrid(config);
			support_event.call(ele);
		},
		pageGrid = function(conf) {
			var ele = $(this)[0];
			var defaultPageGridOptions = $.extend({}, options, {
				viewrecords : true,
				rowNum : 20,
				rowList : [ 20, 50, 100 ],
				prmNames:{sort:'sortField',order:'sortOrder',page:'pageIndex',rows:'pageSize'},
				pager:'#pageDIV'
			});
			
			var config = extendConf.call(ele, defaultPageGridOptions, conf);
			$(this).jqGrid(config);
			support_event.call(ele);
		};
		
		return {
			"grid" : grid,
			"pageGrid" : pageGrid
		};
	})();
	
	$.fn.initGrid = _jqGrid.grid;
	$.fn.initPageGrid = _jqGrid.pageGrid;
	
})(jQuery);


/**
 * jqGrid的查询方法封装
 */
(function($) {
	var w = window;
	
	w.jqGridSearch = function(tableId, conf) {
		
		var loadConf = {};
		loadConf["datatype"] = "json";
		
		if(conf) {
			if(conf.pageIndex) {
				var pageIndex = conf.pageIndex;
				pageIndex = pageIndex < 1 ? 1 : pageIndex;
				loadConf["page"] = pageIndex;
			}
			
			if(conf.postData) {
				loadConf["postData"] = conf.postData;
			}
		}
		
		$('#'+tableId).jqGrid('setGridParam', loadConf).trigger("reloadGrid");
	};
})(jQuery);