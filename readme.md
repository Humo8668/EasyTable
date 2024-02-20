JS lib for table drawing.

Usage
<code>
	<script type="text/javascript" src="EasyTable.js" />
	<EzTable name="Employees" onPaging="pagination()" onFiltering="filter()">
		<column name="id" title="ID" format="number">
			<filter label="Identification number"></filter>
		</column>
		<column name="name" title="Eployee name">
			<filter operator="_like_"></filter>
		</column>
		<column name="dep_id" hidden> </column>
		<column name="dep_name" title="Department"> </column>
		<column name="salary" title="Salary" format="number" >
			<filter operator="range"></filter>
		</column>
		<column name="hired_date" title="Date of hiring" format="date"> </column>
	</EzTable>
</code>

Dependencies:
- Bootstrap 4
- JQuery 3.6.*