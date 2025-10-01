<?php

namespace Database\Factories;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Inventory>
 */
class InventoryFactory extends Factory
{
    protected $model = Inventory::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Engine', 'Brakes', 'Electrical', 'Suspension', 'Transmission', 'Filters', 'Oils & Fluids'];
        $suppliers = ['AutoParts Plus', 'ProMechanic Supply', 'Elite Auto Components', 'MasterParts Inc', 'SpeedTech Parts'];
        $locations = ['A1-01', 'A1-02', 'B2-01', 'B2-02', 'C3-01', 'C3-02', 'D4-01', 'D4-02'];

        return [
            'item_id' => $this->faker->unique()->regexify('[A-Z]{3}-[A-Z]{3}-[0-9]{3}'),
            'item_name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(8),
            'category' => $this->faker->randomElement($categories),
            'stock' => $this->faker->numberBetween(0, 100),
            'reorder_level' => $this->faker->numberBetween(5, 20),
            'unit_price' => $this->faker->randomFloat(2, 5, 500),
            'supplier' => $this->faker->randomElement($suppliers),
            'location' => $this->faker->randomElement($locations),
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }

    /**
     * Indicate that the inventory item is low stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => $this->faker->numberBetween(0, $attributes['reorder_level']),
        ]);
    }

    /**
     * Indicate that the inventory item is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }
}
