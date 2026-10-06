local ROOT = workspace:FindFirstChild("Changes")
assert(ROOT, "pasta da build nao encontrada: ajustar ROOT")

local function boxLike(p)
	return not p:IsA("Part") or p.Shape == Enum.PartType.Block
end
local FIX_ZFIGHT = false
local EPS = 0.02
local GROUND_MIN_AREA = 40000
local SOFT = { GroundPatches = true, Ambience = true, Beach = true, Foam = true, Clouds = true, Ocean = true }

local function faces(p)
	local cf, s = p.CFrame, p.Size
	local dirs = { cf.RightVector, cf.UpVector, -cf.LookVector }
	local sizes = { s.X, s.Y, s.Z }
	local list = {}
	for i = 1, 3 do
		local j, k = (i % 3) + 1, ((i + 1) % 3) + 1
		for _, sign in { 1, -1 } do
			local n = dirs[i] * sign
			table.insert(list, { n = n, c = cf.Position + n * sizes[i] / 2, u = dirs[j], uh = sizes[j] / 2, v = dirs[k], vh = sizes[k] / 2, axis = i })
		end
	end
	return list
end

local function rectOverlap(a, b)
	local minU, maxU, minV, maxV = math.huge, -math.huge, math.huge, -math.huge
	for _, su in { -1, 1 } do
		for _, sv in { -1, 1 } do
			local d = b.c + b.u * b.uh * su + b.v * b.vh * sv - a.c
			local u, v = d:Dot(a.u), d:Dot(a.v)
			minU, maxU = math.min(minU, u), math.max(maxU, u)
			minV, maxV = math.min(minV, v), math.max(maxV, v)
		end
	end
	return math.min(maxU, a.uh) - math.max(minU, -a.uh) > EPS and math.min(maxV, a.vh) - math.max(minV, -a.vh) > EPS
end

local function softPart(p)
	for name in SOFT do
		if p:FindFirstAncestor(name) then
			return true
		end
	end
	return false
end

local function objectOf(inst)
	local cur = inst
	while cur.Parent and cur.Parent ~= workspace do
		if cur.Parent:IsA("Folder") or cur.Parent == ROOT then
			return cur
		end
		cur = cur.Parent
	end
	return cur
end

local scope = {}
for _, c in workspace:GetChildren() do
	if not c:IsA("Terrain") and not c:IsA("Camera") then
		table.insert(scope, c)
	end
end
local saved = {}
local groundParts = {}
for _, f in scope do
	local list = f:IsA("BasePart") and { f } or f:GetDescendants()
	for _, p in list do
		if p:IsA("BasePart") then
			saved[p] = p.CanQuery
			p.CanQuery = true
			if not p:IsDescendantOf(ROOT) and (p.Transparency >= 1 or p.Size.X * p.Size.Z >= GROUND_MIN_AREA) then
				table.insert(groundParts, p)
			end
		end
	end
end

local near = OverlapParams.new()
near.FilterType = Enum.RaycastFilterType.Include
near.FilterDescendantsInstances = scope

local zfight = {}
local fixes = {}
local seen = {}
for _, p in ROOT:GetDescendants() do
	if p:IsA("BasePart") and p.Transparency < 1 and boxLike(p) then
		local fa = faces(p)
		for _, o in workspace:GetPartBoundsInBox(p.CFrame, p.Size + Vector3.new(0.1, 0.1, 0.1), near) do
			if o ~= p and o.Transparency < 1 and not seen[o] and boxLike(o) then
				local fb = faces(o)
				for _, a in fa do
					if a.n.Y > -0.9 then
						for _, b in fb do
							if a.n:Dot(b.n) > 0.999 and math.abs((b.c - a.c):Dot(a.n)) < EPS and rectOverlap(a, b) then
								table.insert(zfight, p:GetFullName() .. " / " .. o:GetFullName())
								local mover, face = p, a
								if o:IsDescendantOf(ROOT) and o.Size.X * o.Size.Y * o.Size.Z < p.Size.X * p.Size.Y * p.Size.Z then
									mover, face = o, b
								end
								fixes[mover] = fixes[mover] or {}
								fixes[mover][face.axis .. tostring(face.n)] = face
							end
						end
					end
				end
			end
		end
		seen[p] = true
	end
end

if FIX_ZFIGHT then
	for p, list in fixes do
		for _, face in list do
			local s = { p.Size.X, p.Size.Y, p.Size.Z }
			if s[face.axis] > 0.3 then
				s[face.axis] -= 0.04
				p.Size = Vector3.new(s[1], s[2], s[3])
				p.CFrame = p.CFrame - face.n * 0.02
			else
				p.CFrame = p.CFrame - face.n * 0.03
			end
		end
	end
end

local exclude = table.clone(groundParts)
for _, d in ROOT:GetDescendants() do
	if SOFT[d.Name] then
		table.insert(exclude, d)
	end
end
local inside = OverlapParams.new()
inside.FilterType = Enum.RaycastFilterType.Exclude
inside.FilterDescendantsInstances = exclude

local crossings = {}
for _, p in ROOT:GetDescendants() do
	if p:IsA("BasePart") and p.Transparency < 1 and not softPart(p) then
		local mine = objectOf(p)
		for _, o in workspace:GetPartsInPart(p, inside) do
			if o.Transparency < 1 then
				local other = objectOf(o)
				if other ~= mine and not mine:IsAncestorOf(o) and not other:IsAncestorOf(p) then
					local key = mine:GetFullName() .. "  X  " .. other:GetFullName()
					crossings[key] = (crossings[key] or 0) + 1
				end
			end
		end
	end
end

for p, v in saved do
	p.CanQuery = v
end

local lines = { "zfight=" .. #zfight .. (FIX_ZFIGHT and " (fixed)" or "") }
for i = 1, math.min(15, #zfight) do
	table.insert(lines, "  " .. zfight[i])
end
local keys = {}
for k, v in crossings do
	table.insert(keys, v .. "  " .. k)
end
table.sort(keys)
table.insert(lines, "crossings=" .. #keys)
for i = 1, math.min(25, #keys) do
	table.insert(lines, "  " .. keys[i])
end
return table.concat(lines, "\n")
