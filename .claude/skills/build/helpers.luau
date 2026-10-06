local STYLES = {
	studs = { MATERIAL = Enum.Material.Plastic, VARIANT = "Studs", GRID = 0.25, FREE_ROTATION = false, SHAPES = false },
	smooth = { MATERIAL = Enum.Material.SmoothPlastic, VARIANT = "", GRID = 0.25, FREE_ROTATION = false, SHAPES = true },
	lowpoly = { MATERIAL = Enum.Material.SmoothPlastic, VARIANT = "", GRID = 0.05, FREE_ROTATION = true, SHAPES = true },
	realistic = { MATERIAL = Enum.Material.Concrete, VARIANT = "", GRID = 0, FREE_ROTATION = true, SHAPES = true },
}

local CONFIG = {
	STYLE = "studs",
	ROOT = "Changes",
	GROUND_Y = 0,
	WATER_Y = nil,
	CENTER = Vector3.new(0, 0, 0),
	BOUNDS_MIN = Vector2.new(-256, -256),
	BOUNDS_MAX = Vector2.new(256, 256),
	PLAIN_MATERIALS = { [Enum.Material.Neon] = true, [Enum.Material.Glass] = true, [Enum.Material.ForceField] = true },
	BLOCKER_ROOTS = {},
	GROUND_PARTS = {},
	SOFT_FOLDERS = { GroundPatches = true, Ambience = true },
}

local function useStyle(name, overrides)
	CONFIG.STYLE = name
	for key, value in STYLES[name] or {} do
		CONFIG[key] = value
	end
	for key, value in overrides or {} do
		CONFIG[key] = value
	end
end

useStyle(CONFIG.STYLE)

local CHS = game:GetService("ChangeHistoryService")

local function q(v)
	if CONFIG.GRID <= 0 then
		return v
	end
	return math.floor(v / CONFIG.GRID + 0.5) * CONFIG.GRID
end

local function snapSize(size)
	local minimum = CONFIG.GRID > 0 and CONFIG.GRID or 0.05
	local function axis(v)
		if v < minimum then
			return math.max(0.05, v)
		end
		return q(v)
	end
	return Vector3.new(axis(size.X), axis(size.Y), axis(size.Z))
end

local SHAPE_CLASSES = { Wedge = "WedgePart", CornerWedge = "CornerWedgePart", Truss = "TrussPart" }
local SHAPE_ENUMS = { Cylinder = Enum.PartType.Cylinder, Ball = Enum.PartType.Ball }

local function part(parent, name, size, cf, color, opts)
	opts = opts or {}
	local shape = opts.shape
	if shape and not CONFIG.SHAPES and not opts.forceShape then
		error("style " .. CONFIG.STYLE .. " usa so blocos; passe forceShape = true se o usuario pediu " .. shape)
	end
	local p = Instance.new(SHAPE_CLASSES[shape] or "Part")
	if SHAPE_ENUMS[shape] then
		p.Shape = SHAPE_ENUMS[shape]
	end
	p.Name = name
	p.Anchored = true
	p.Size = snapSize(size)
	p.CFrame = cf
	p.Color = color
	local material = opts.material or CONFIG.MATERIAL
	p.Material = material
	local plain = CONFIG.PLAIN_MATERIALS[material] == true
	local variant = opts.variant
	if variant == nil then
		variant = material == CONFIG.MATERIAL and CONFIG.VARIANT or ""
	end
	p.MaterialVariant = (plain or variant == false) and "" or variant
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CanCollide = opts.collide == true
	p.CanTouch = false
	p.CanQuery = false
	p.CastShadow = opts.shadow ~= false and not plain
	if opts.transparency then
		p.Transparency = opts.transparency
	end
	if opts.reflectance then
		p.Reflectance = opts.reflectance
	end
	for k, v in opts.attributes or {} do
		p:SetAttribute(k, v)
	end
	p.Parent = parent
	return p
end

local function light(p, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range
	l.Brightness = brightness
	l.Shadows = false
	l.Parent = p
	return l
end

local function facing(x, z, target)
	target = target or CONFIG.CENTER
	local dir = Vector3.new(target.X - x, 0, target.Z - z)
	if dir.Magnitude < 1e-3 then
		dir = Vector3.new(0, 0, -1)
	end
	if not CONFIG.FREE_ROTATION then
		if math.abs(dir.X) > math.abs(dir.Z) then
			dir = Vector3.new(math.sign(dir.X), 0, 0)
		else
			dir = Vector3.new(0, 0, math.sign(dir.Z))
		end
	end
	return CFrame.lookAt(Vector3.new(x, 0, z), Vector3.new(x, 0, z) + dir.Unit)
end

local function root()
	local r = workspace:FindFirstChild(CONFIG.ROOT)
	if not r then
		r = Instance.new("Folder")
		r.Name = CONFIG.ROOT
		r.Parent = workspace
	end
	return r
end

local function freshFolder(parent, name, className)
	local old = parent:FindFirstChild(name)
	if old then
		old:Destroy()
	end
	local f = Instance.new(className or "Folder")
	f.Name = name
	f.Parent = parent
	return f
end

local function record(label, fn)
	local id = CHS:TryBeginRecording(label)
	local ok, result = pcall(fn)
	if id then
		CHS:FinishRecording(id, ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel)
	end
	if not ok then
		error(result)
	end
	return result
end

local function withQuery(instances, fn)
	local saved = {}
	for _, inst in instances do
		local list = inst:IsA("BasePart") and { inst } or inst:GetDescendants()
		for _, p in list do
			if p:IsA("BasePart") then
				saved[p] = p.CanQuery
				p.CanQuery = true
			end
		end
	end
	local ok, result = pcall(fn)
	for p, v in saved do
		p.CanQuery = v
	end
	if not ok then
		error(result)
	end
	return result
end

local function blockers(extra)
	local ground = {}
	for _, g in CONFIG.GROUND_PARTS do
		ground[g] = true
	end
	local list = {}
	for _, r in CONFIG.BLOCKER_ROOTS do
		for _, c in r:GetChildren() do
			if not ground[c] then
				table.insert(list, c)
			end
		end
	end
	local own = workspace:FindFirstChild(CONFIG.ROOT)
	if own then
		for _, c in own:GetChildren() do
			if not CONFIG.SOFT_FOLDERS[c.Name] and not c:IsA("BaseScript") then
				table.insert(list, c)
			end
		end
	end
	for _, e in extra or {} do
		table.insert(list, e)
	end
	return list
end

local function isFree(cf, size, include)
	local params = OverlapParams.new()
	params.FilterType = Enum.RaycastFilterType.Include
	params.FilterDescendantsInstances = include
	return #workspace:GetPartBoundsInBox(cf, size, params) == 0
end

local function findSpot(area, footprint, height, target, include, step)
	step = step or 2
	local best, bestDist
	for x = area.min.X + footprint.X / 2, area.max.X - footprint.X / 2, step do
		for z = area.min.Y + footprint.Y / 2, area.max.Y - footprint.Y / 2, step do
			if isFree(CFrame.new(x, CONFIG.GROUND_Y + height / 2 + 0.25, z), Vector3.new(footprint.X, height, footprint.Y), include) then
				local dist = (x - target.X) ^ 2 + (z - target.Y) ^ 2
				if not bestDist or dist < bestDist then
					best, bestDist = Vector2.new(x, z), dist
				end
			end
		end
	end
	return best
end

local function insideBounds(x, z, pad)
	pad = pad or 0
	return x > CONFIG.BOUNDS_MIN.X - pad and x < CONFIG.BOUNDS_MAX.X + pad and z > CONFIG.BOUNDS_MIN.Y - pad and z < CONFIG.BOUNDS_MAX.Y + pad
end

local function groundAt(x, z, include)
	local params = RaycastParams.new()
	if include then
		params.FilterType = Enum.RaycastFilterType.Include
		params.FilterDescendantsInstances = include
	end
	local hit = withQuery(include or {}, function()
		return workspace:Raycast(Vector3.new(x, CONFIG.GROUND_Y + 500, z), Vector3.new(0, -1000, 0), params)
	end)
	return hit and hit.Position.Y or CONFIG.GROUND_Y
end

local function stack(parent, layers, originCf, startY)
	local y = startY
	local made = {}
	for _, layer in layers do
		local p = part(parent, layer.name, Vector3.new(layer.w, layer.h, layer.d), originCf * CFrame.new(layer.x or 0, y + layer.h / 2, layer.z or 0), layer.color, layer.opts)
		table.insert(made, p)
		y += layer.h
	end
	return made, y
end

local function attach(parent, name, size, anchorPart, offset, color, opts)
	return part(parent, name, size, anchorPart.CFrame * offset, color, opts)
end
