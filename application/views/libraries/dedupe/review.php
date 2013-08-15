<script>
var libraryid = <?=$library['libraryid']?>;
$(function() {
});
</script>
<style>
.table-dupes {
	width: 100%;
}
.table-dupes td > div {
	word-break: break-all;
}
</style>
<legend>
	De-duplication review
	<div class="btn-group pull-right">
		<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
			<i class="icon-cog"></i> <span class="caret"></span>
		</a>
		<ul class="dropdown-menu">
			<li><a href="/libraries/dedupe/<?=$library['libraryid']?>/force"><i class="icon-resize-small"></i> Force reprocessing</a></li>
		</ul>
	</div>
</legend>

<div id="dupes-outer"><div id="dupes-inner">
<? foreach ($dupes as $ref) {
	if ($ref['data'])
		$ref = array_merge($ref, json_decode($ref['data'], TRUE));
	$alts = json_decode($ref['altdata'], TRUE);

	$altrefs = array();
	foreach($alts as $key => $vals) 
		foreach ($vals as $refid => $data)
			$altrefs[$refid] = 1;
?>
<legend>
	<?=$ref['title']?>
	<div class="btn-group pull-right">
		<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
			<i class="icon-tag"></i> <span class="caret"></span>
		</a>
		<ul class="dropdown-menu">
			<li><a href="/references/edit/<?=$ref['referenceid']?>"><i class="icon-pencil"></i> Edit reference </a></li>
			<li class="divider"></li>
			<li><a href="/references/delete/<?=$ref['referenceid']?>"><i class="icon-trash"></i> Delete reference</a></li>
		</ul>
	</div>
</legend>
<div class="row-fluid pad-top">
	<table class="table table-bordered table-striped table-hover table-dupes">
		<thead>
			<th>Field</th>
			<th><a href="/references/view/<?=$ref['referenceid']?>">Reference #<?=$ref['referenceid']?></a></th>
			<? foreach ($altrefs as $altrefid => $junk) { ?>
			<th><a href="/references/view/<?=$altrefid?>">Reference #<?=$altrefid?></a></th>
			<? } ?>
		</thead>
		<? foreach ($alts as $field => $val) { ?>
		<tr>
			<th><?=$field?></th>
			<td><div><?=$this->Reference->Flatten($ref[$field], "<br/>")?></div></td>
			<? foreach ($altrefs as $altrefid => $junk) { ?>
			<? if (isset($alts[$field][$altrefid])) { ?>
				<td><div><?=$this->Reference->Flatten($alts[$field][$altrefid])?></div></td>
			<? } else { ?>
				<td>&nbsp;</td>
			<? } ?>
			<? } ?>
		</tr>
		<? } ?>
	</table>
</div>
<? } ?>
</div></div>
