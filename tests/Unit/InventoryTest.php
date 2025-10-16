<?php

it('can add an item to the inventory', function () {
    $inventory = new Inventory();
    $item = new Item('Test Item', 10);
    $inventory->add($item);
    expect($inventory->count())->toBe(1);
});

it('can remove an item from the inventory', function () {
    $inventory = new Inventory();
    $item = new Item('Test Item', 10);
    $inventory->add($item);
    $inventory->remove($item);
    expect($inventory->count())->toBe(0);
});