local THEME = {
	PARENT = game:GetService("StarterGui"),
	GUI = { IgnoreGuiInset = true, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, ScreenInsets = Enum.ScreenInsets.DeviceSafeInsets, ResetOnSpawn = false },
	FONT = Font.new("rbxasset://fonts/families/FredokaOne.json", Enum.FontWeight.Bold),
	TEXT_COLOR = Color3.fromRGB(255, 255, 255),
	TEXT_STROKE = { color = Color3.fromRGB(0, 0, 0), thickness = 0.08, transparency = 0, sizing = Enum.StrokeSizingMode.ScaledSize },
	TEXT_MAX = 72,
	BORDER = {
		{ color = Color3.fromRGB(255, 255, 255), thickness = 0.025, transparency = 0.5 },
		{ color = Color3.fromRGB(0, 0, 0), thickness = 0.025, transparency = 0 },
	},
	BORDER_SIZING = Enum.StrokeSizingMode.ScaledSize,
	CORNER = UDim.new(0.1, 0),
	PANEL_CORNER = UDim.new(0.04, 0),
	TEXTURE = { image = "", transparency = 0.7, tile = UDim2.fromOffset(400, 200) },
	PANEL = { color = Color3.fromRGB(66, 71, 88), transparency = 0.2, top = Color3.fromRGB(255, 255, 255), bottom = Color3.fromRGB(56, 60, 74) },
	HEADER = { height = 0.16, outside = true, palette = "red" },
	PALETTE = {
		red = { Color3.fromRGB(235, 85, 60), Color3.fromRGB(95, 20, 15) },
		green = { Color3.fromRGB(99, 240, 80), Color3.fromRGB(18, 132, 39) },
		blue = { Color3.fromRGB(70, 160, 255), Color3.fromRGB(20, 70, 190) },
		gold = { Color3.fromRGB(240, 205, 125), Color3.fromRGB(150, 105, 45) },
		purple = { Color3.fromRGB(200, 120, 255), Color3.fromRGB(90, 30, 150) },
		teal = { Color3.fromRGB(80, 170, 150), Color3.fromRGB(20, 70, 65) },
		dark = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(56, 60, 74) },
		light = { Color3.fromRGB(240, 248, 255), Color3.fromRGB(150, 180, 210) },
	},
	BUTTON_TAGS = {},
	TEXT_TAGS = {},
	PANEL_TAGS = {},
}

local Z = { TEXTURE = 1, DECOR = 2, ICON = 3, CONTENT = 4, TEXT = 5, OVERLAY = 6 }

local CHS = game:GetService("ChangeHistoryService")
local CS = game:GetService("CollectionService")

local function new(className, parent, props)
	local inst = Instance.new(className)
	for key, value in props or {} do
		inst[key] = value
	end
	inst.Parent = parent
	return inst
end

local function tagAll(inst, tags)
	for _, tag in tags or {} do
		CS:AddTag(inst, tag)
	end
end

local function rect(x, y, w, h)
	return UDim2.fromScale(x, y), UDim2.fromScale(w, h)
end

local function frame(parent, name, props)
	local base = { Name = name, BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.fromScale(1, 1) }
	for key, value in props or {} do
		base[key] = value
	end
	return new("Frame", parent, base)
end

local function centered(obj, w, h)
	obj.AnchorPoint = Vector2.new(0.5, 0.5)
	obj.Position = UDim2.fromScale(0.5, 0.5)
	if w then
		obj.Size = UDim2.fromScale(w, h)
	end
	return obj
end

local function aspect(obj, ratio, dominant)
	return new("UIAspectRatioConstraint", obj, { AspectRatio = ratio, DominantAxis = dominant or Enum.DominantAxis.Width })
end

local function item(parent, name, ratio, widthScale, order)
	local obj = frame(parent, name, { Size = UDim2.new(widthScale or 1, 0, 100, 0), LayoutOrder = order or 0 })
	aspect(obj, ratio)
	return obj
end

local function corner(obj, radius)
	return new("UICorner", obj, { CornerRadius = radius or THEME.CORNER })
end

local function padding(obj, scale)
	local p = UDim.new(scale or 0.04, 0)
	return new("UIPadding", obj, { PaddingLeft = p, PaddingRight = p, PaddingTop = p, PaddingBottom = p })
end

local function list(obj, direction, gap, horizontal, vertical)
	return new("UIListLayout", obj, {
		FillDirection = direction or Enum.FillDirection.Vertical,
		Padding = UDim.new(gap or 0.02, 0),
		HorizontalAlignment = horizontal or Enum.HorizontalAlignment.Center,
		VerticalAlignment = vertical or (direction == Enum.FillDirection.Horizontal and Enum.VerticalAlignment.Center or Enum.VerticalAlignment.Top),
		SortOrder = Enum.SortOrder.LayoutOrder,
	})
end

local function grid(obj, cell, gap, perRow)
	local layout = new("UIGridLayout", obj, {
		CellSize = cell,
		CellPadding = gap or UDim2.fromScale(0.02, 0.02),
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Top,
		SortOrder = Enum.SortOrder.LayoutOrder,
	})
	if perRow then
		layout.FillDirectionMaxCells = perRow
	end
	return layout
end

local function strokes(obj, specs, mode, sizing)
	local made = {}
	for _, spec in specs do
		table.insert(made, new("UIStroke", obj, {
			ApplyStrokeMode = mode or Enum.ApplyStrokeMode.Border,
			Color = spec.color,
			Thickness = spec.thickness,
			Transparency = spec.transparency or 0,
			LineJoinMode = Enum.LineJoinMode.Round,
			StrokeSizingMode = spec.sizing or sizing or THEME.BORDER_SIZING,
		}))
	end
	return made
end

local function border(obj, scale)
	if not scale or scale == 1 then
		return strokes(obj, THEME.BORDER)
	end
	local specs = {}
	for _, spec in THEME.BORDER do
		table.insert(specs, { color = spec.color, thickness = spec.thickness * scale, transparency = spec.transparency, sizing = spec.sizing })
	end
	return strokes(obj, specs)
end

local function shade(color, amount)
	return amount >= 0 and color:Lerp(Color3.new(1, 1, 1), amount) or color:Lerp(Color3.new(0, 0, 0), -amount)
end

local function fill(obj, palette, rotation)
	local pair = typeof(palette) == "string" and THEME.PALETTE[palette] or palette
	if typeof(pair) == "Color3" then
		pair = { shade(pair, 0.2), shade(pair, -0.55) }
	end
	obj.BackgroundColor3 = Color3.new(1, 1, 1)
	obj.BackgroundTransparency = 0
	return new("UIGradient", obj, {
		Color = ColorSequence.new(pair[1], pair[2]),
		Rotation = rotation or 90,
	})
end

local function texture(obj, radius, transparency)
	if THEME.TEXTURE.image == "" then
		return nil
	end
	local img = new("ImageLabel", obj, {
		Name = "BackgroundTexture",
		BackgroundTransparency = 1,
		Size = UDim2.fromScale(1, 1),
		Image = THEME.TEXTURE.image,
		ImageTransparency = transparency or THEME.TEXTURE.transparency,
		ScaleType = Enum.ScaleType.Tile,
		TileSize = THEME.TEXTURE.tile,
		ZIndex = Z.TEXTURE,
	})
	if radius ~= false then
		corner(img, radius or THEME.CORNER)
	end
	return img
end

local function label(parent, name, text, props)
	local base = {
		Name = name,
		Text = text,
		BackgroundTransparency = 1,
		FontFace = THEME.FONT,
		TextColor3 = THEME.TEXT_COLOR,
		TextScaled = true,
		TextWrapped = true,
		Size = UDim2.fromScale(1, 1),
		ZIndex = Z.TEXT,
	}
	for key, value in props or {} do
		base[key] = value
	end
	local strokeSpec = base.Stroke
	local maxText = base.MaxText
	base.Stroke, base.MaxText = nil, nil
	local obj = new("TextLabel", parent, base)
	if strokeSpec ~= false then
		local spec = strokeSpec or THEME.TEXT_STROKE
		strokes(obj, { spec }, Enum.ApplyStrokeMode.Contextual, spec.sizing)
	end
	new("UITextSizeConstraint", obj, { MaxTextSize = maxText or THEME.TEXT_MAX, MinTextSize = 8 })
	tagAll(obj, THEME.TEXT_TAGS)
	return obj
end

local function icon(parent, name, image, props)
	local base = {
		Name = name,
		Image = image,
		BackgroundTransparency = 1,
		ScaleType = Enum.ScaleType.Fit,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromScale(0.6, 0.6),
		ZIndex = Z.ICON,
	}
	for key, value in props or {} do
		base[key] = value
	end
	local obj = new("ImageLabel", parent, base)
	aspect(obj, 1)
	return obj
end

local function surface(obj, palette, radius, borderScale)
	fill(obj, palette)
	if radius ~= false then
		corner(obj, radius or THEME.CORNER)
	end
	border(obj, borderScale)
	texture(obj, radius)
	return obj
end

local function button(parent, name, opts)
	opts = opts or {}
	local obj = new("ImageButton", parent, {
		Name = name,
		AutoButtonColor = false,
		BorderSizePixel = 0,
		Size = opts.size or UDim2.fromScale(1, 1),
		Position = opts.position or UDim2.fromScale(0.5, 0.5),
		AnchorPoint = opts.anchor or Vector2.new(0.5, 0.5),
		LayoutOrder = opts.order or 0,
		ZIndex = opts.z or 1,
	})
	surface(obj, opts.palette or "green", opts.radius, opts.borderScale)
	if opts.ratio then
		aspect(obj, opts.ratio)
	end
	local layout = opts.layout or (opts.icon and opts.text and "stacked" or "center")
	if opts.icon and layout == "stacked" then
		icon(obj, "Icon", opts.icon, { Position = UDim2.fromScale(0.5, 0.4), Size = UDim2.fromScale(0.6, 0.6) })
		label(obj, "Title", opts.text, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.95), Size = UDim2.fromScale(0.94, 0.24) })
	elseif opts.icon and layout == "row" then
		icon(obj, "Icon", opts.icon, { Position = UDim2.fromScale(0.16, 0.5), Size = UDim2.fromScale(0.7, 0.7), AnchorPoint = Vector2.new(0.5, 0.5) })
		label(obj, "Title", opts.text or "", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.fromScale(0.3, 0.5), Size = UDim2.fromScale(0.64, 0.6), TextXAlignment = Enum.TextXAlignment.Left })
	elseif opts.icon then
		icon(obj, "Icon", opts.icon, { Size = UDim2.fromScale(0.7, 0.7) })
	elseif opts.text then
		label(obj, "Title", opts.text, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.86, 0.62) })
	end
	tagAll(obj, THEME.BUTTON_TAGS)
	return obj
end

local function closeButton(parent, opts)
	opts = opts or {}
	local obj = button(parent, "Close", {
		palette = opts.palette or "red",
		text = "X",
		anchor = Vector2.new(0.5, 0.5),
		position = opts.position or UDim2.fromScale(0.94, 0.5),
		size = UDim2.fromScale(1, opts.height or 0.72),
		ratio = 1,
		radius = opts.radius or UDim.new(0.2, 0),
		z = Z.OVERLAY,
	})
	obj:FindFirstChildOfClass("UIAspectRatioConstraint").DominantAxis = Enum.DominantAxis.Height
	return obj
end

local function panel(parent, name, opts)
	opts = opts or {}
	local obj = frame(parent, name, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = opts.position or UDim2.fromScale(0.5, 0.5),
		Size = opts.size or UDim2.fromScale(0.5, 0.6),
		Visible = opts.visible ~= false,
		ZIndex = 1,
	})
	aspect(obj, opts.ratio or 1.9)
	obj.BackgroundColor3 = THEME.PANEL.color
	obj.BackgroundTransparency = THEME.PANEL.transparency
	new("UIGradient", obj, { Color = ColorSequence.new(THEME.PANEL.top, THEME.PANEL.bottom), Rotation = 90 })
	local panelRadius = opts.radius == nil and THEME.PANEL_CORNER or opts.radius
	if panelRadius then
		corner(obj, panelRadius)
	end
	border(obj, opts.borderScale or 0.4)
	texture(obj, panelRadius or false, opts.textureTransparency)
	tagAll(obj, THEME.PANEL_TAGS)
	local header
	if opts.title then
		local h = THEME.HEADER.height
		local outside = opts.headerOutside
		if outside == nil then
			outside = THEME.HEADER.outside
		end
		header = frame(obj, "Header", {
			AnchorPoint = Vector2.new(0.5, outside and 1 or 0),
			Position = UDim2.fromScale(0.5, outside and 0.015 or 0),
			Size = UDim2.fromScale(1.01, h),
			ZIndex = Z.CONTENT,
		})
		if outside then
			header:SetAttribute("AllowOverflow", true)
		end
		surface(header, opts.headerPalette or THEME.HEADER.palette, UDim.new(0.16, 0), 1.6)
		label(header, "Title", opts.title, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.6, 0.78) })
		if opts.close ~= false then
			closeButton(header, { palette = opts.closePalette })
		end
	end
	local body = frame(obj, "Body", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.fromScale(0.5, 1),
		Size = UDim2.fromScale(1, (header and not THEME.HEADER.outside) and 1 - THEME.HEADER.height or 1),
		ZIndex = Z.CONTENT,
	})
	padding(body, opts.padding or 0.03)
	return obj, body, header
end

local function scroll(parent, name, props)
	local base = {
		Name = name,
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		Size = UDim2.fromScale(1, 1),
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollingDirection = Enum.ScrollingDirection.Y,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = Color3.new(1, 1, 1),
		ZIndex = Z.CONTENT,
	}
	for key, value in props or {} do
		base[key] = value
	end
	return new("ScrollingFrame", parent, base)
end

local function freshGui(name, parent)
	parent = parent or THEME.PARENT
	local old = parent:FindFirstChild(name)
	if old then
		old:Destroy()
	end
	local props = { Name = name }
	for key, value in THEME.GUI do
		props[key] = value
	end
	return new("ScreenGui", parent, props)
end

local function freshChild(parent, name)
	local old = parent:FindFirstChild(name)
	if old then
		old:Destroy()
	end
end

local function record(name, fn)
	local id = CHS:TryBeginRecording(name)
	local ok, result = pcall(fn)
	if id then
		CHS:FinishRecording(id, ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel)
	end
	if not ok then
		error(result)
	end
	return result
end
