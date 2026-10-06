local IGNORE_ROOTS = { Changes = true }
local GROUND_MIN_AREA = 2500

local function key3(c)
	return string.format("%d,%d,%d", math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5))
end

local function onGrid(v, g)
	return math.abs(v / g - math.floor(v / g + 0.5)) < 0.01
end

local materials, variants, colors = {}, {}, {}
local grid = { [0.25] = 0, [0.5] = 0, [1] = 0 }
local total = 0
local mn, mx = Vector3.new(math.huge, math.huge, math.huge), Vector3.new(-math.huge, -math.huge, -math.huge)
local grounds, waters, fonts = {}, {}, {}
local roots = {}

for _, top in workspace:GetChildren() do
	if not IGNORE_ROOTS[top.Name] and not top:IsA("Terrain") and not top:IsA("Camera") then
		local count = 0
		local list = top:IsA("BasePart") and { top } or top:GetDescendants()
		for _, p in list do
			if p:IsA("BasePart") and p.Transparency < 1 then
				count += 1
				total += 1
				materials[p.Material.Name] = (materials[p.Material.Name] or 0) + 1
				local v = p.MaterialVariant ~= "" and p.MaterialVariant or "(none)"
				variants[v] = (variants[v] or 0) + 1
				local k = key3(p.Color)
				colors[k] = (colors[k] or 0) + 1
				for g in grid do
					if onGrid(p.Size.X, g) and onGrid(p.Size.Y, g) and onGrid(p.Size.Z, g) then
						grid[g] += 1
					end
				end
				local area = p.Size.X * p.Size.Z
				if area < 1e6 then
					mn = mn:Min(p.Position - p.Size / 2)
					mx = mx:Max(p.Position + p.Size / 2)
				end
				local flat = math.abs(p.CFrame.UpVector.Y) > 0.99
				if flat and area >= GROUND_MIN_AREA then
					local topY = p.Position.Y + p.Size.Y / 2
					local isWater = p.Color.B > p.Color.R * 1.4 and p.Color.B > p.Color.G * 1.1
					table.insert(isWater and waters or grounds, { area = area, text = string.format("%s  top=%.2f  size=%.0fx%.0f  at=(%.2f, %.2f)  %s", p:GetFullName(), topY, p.Size.X, p.Size.Z, p.Position.X, p.Position.Z, key3(p.Color)) })
				end
			end
			if p:IsA("TextLabel") or p:IsA("TextButton") then
				local f = p.FontFace.Family .. " " .. p.FontFace.Weight.Name
				fonts[f] = (fonts[f] or 0) + 1
			end
		end
		table.insert(roots, top.Name .. " [" .. top.ClassName .. "] parts=" .. count)
	end
end

local function sorted(map, limit)
	local list = {}
	for k, v in map do
		table.insert(list, { k = k, v = v })
	end
	table.sort(list, function(a, b)
		return a.v > b.v
	end)
	local out = {}
	for i = 1, math.min(limit, #list) do
		table.insert(out, "  " .. list[i].k .. " = " .. list[i].v)
	end
	return table.concat(out, "\n")
end

local function biggest(list, limit)
	table.sort(list, function(a, b)
		return a.area > b.area
	end)
	local out = {}
	for i = 1, math.min(limit, #list) do
		table.insert(out, list[i].text)
	end
	return #out > 0 and table.concat(out, "\n  ") or "none"
end

local mvs = {}
for _, v in game:GetService("MaterialService"):GetDescendants() do
	if v:IsA("MaterialVariant") then
		table.insert(mvs, "  " .. v.Name .. " base=" .. v.BaseMaterial.Name .. " studsPerTile=" .. v.StudsPerTile)
	end
end

local terrainWater = 0
local ok = pcall(function()
	local region = Region3.new(mn, mx):ExpandToGrid(4)
	local mats = workspace.Terrain:ReadVoxels(region, 4)
	local size = mats.Size
	for x = 1, size.X, 4 do
		for y = 1, size.Y, 4 do
			for z = 1, size.Z, 4 do
				if mats[x][y][z] == Enum.Material.Water then
					terrainWater += 1
				end
			end
		end
	end
end)

local lighting = game:GetService("Lighting")
local lines = {
	"== roots ==",
	table.concat(roots, "\n"),
	string.format("== bounds (visible parts) ==\n  min=%s\n  max=%s\n  center=%s", tostring(mn), tostring(mx), tostring((mn + mx) / 2)),
	"== materials ==\n" .. sorted(materials, 8),
	"== material variants (parts) ==\n" .. sorted(variants, 8),
	"== MaterialService variants ==\n" .. (#mvs > 0 and table.concat(mvs, "\n") or "  none"),
	string.format("== size grid (of %d parts) ==\n  0.25=%d  0.5=%d  1=%d", total, grid[0.25], grid[0.5], grid[1]),
	"== top colors (R,G,B) ==\n" .. sorted(colors, 24),
	"== ground candidates (largest first) ==\n  " .. biggest(grounds, 12),
	"== water candidates ==\n  " .. biggest(waters, 6) .. "\n  terrain water samples=" .. (ok and terrainWater or -1),
	"== fonts ==\n" .. sorted(fonts, 5),
	string.format("== lighting ==\n  ClockTime=%.2f Brightness=%.2f effects=%d", lighting.ClockTime, lighting.Brightness, #lighting:GetChildren()),
	"== streaming ==\n  StreamingEnabled=" .. tostring(workspace.StreamingEnabled),
}
return table.concat(lines, "\n")
