import Foundation

// A lightweight AnyCodable to allow dictionary-based mapping without pulling in Firebase types.
public struct AnyCodable: Codable {
    public let value: Any
    public init(_ value: Any) { self.value = value }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) { value = intVal; return }
        if let doubleVal = try? container.decode(Double.self) { value = doubleVal; return }
        if let boolVal = try? container.decode(Bool.self) { value = boolVal; return }
        if let stringVal = try? container.decode(String.self) { value = stringVal; return }
        if container.decodeNil() { value = NSNull(); return }
        if let arrVal = try? container.decode([AnyCodable].self) { value = arrVal.map { $0.value }; return }
        if let dictVal = try? container.decode([String: AnyCodable].self) { value = dictVal.mapValues { $0.value }; return }
        throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let intVal as Int: try container.encode(intVal)
        case let doubleVal as Double: try container.encode(doubleVal)
        case let boolVal as Bool: try container.encode(boolVal)
        case let stringVal as String: try container.encode(stringVal)
        case _ as NSNull: try container.encodeNil()
        case let arrVal as [Any]: try container.encode(arrVal.map { AnyCodable($0) })
        case let dictVal as [String: Any]: try container.encode(dictVal.mapValues { AnyCodable($0) })
        default:
            let context = EncodingError.Context(codingPath: container.codingPath, debugDescription: "Unsupported type")
            throw EncodingError.invalidValue(value, context)
        }
    }
}

public typealias FirestoreDict = [String: AnyCodable]

// MARK: - Product mappers
public func productFromFirestore(id: String, data: FirestoreDict) -> Product? {
    guard let workspaceId = data["workspaceId"]?.value as? String,
          let name = data["name"]?.value as? String else { return nil }
    let updatedAtSeconds = (data["updatedAt"]?.value as? Double) ?? Date().timeIntervalSince1970
    return Product(
        id: Ident(id),
        workspaceId: workspaceId,
        sku: data["sku"]?.value as? String,
        name: name,
        category: data["category"]?.value as? String,
        materialType: data["materialType"]?.value as? String,
        uom: data["uom"]?.value as? String,
        cost: data["cost"]?.value as? Double,
        price: data["price"]?.value as? Double,
        vendor: data["vendor"]?.value as? String,
        tags: data["tags"]?.value as? [String] ?? [],
        archived: data["archived"]?.value as? Bool ?? false,
        updatedAt: Date(timeIntervalSince1970: updatedAtSeconds)
    )
}

public func productToFirestore(_ product: Product) -> FirestoreDict {
    return [
        "workspaceId": AnyCodable(product.workspaceId),
        "sku": AnyCodable(product.sku as Any),
        "name": AnyCodable(product.name),
        "category": AnyCodable(product.category as Any),
        "materialType": AnyCodable(product.materialType as Any),
        "uom": AnyCodable(product.uom as Any),
        "cost": AnyCodable(product.cost as Any),
        "price": AnyCodable(product.price as Any),
        "vendor": AnyCodable(product.vendor as Any),
        "tags": AnyCodable(product.tags),
        "archived": AnyCodable(product.archived),
        "updatedAt": AnyCodable(product.updatedAt.timeIntervalSince1970)
    ]
}

// MARK: - PriceBook mappers
public func priceBookFromFirestore(id: String, data: FirestoreDict) -> PriceBook? {
    guard let workspaceId = data["workspaceId"]?.value as? String,
          let name = data["name"]?.value as? String else { return nil }
    let updatedAtSeconds = (data["updatedAt"]?.value as? Double) ?? Date().timeIntervalSince1970
    let effectiveFromSeconds = data["effectiveFrom"]?.value as? Double
    let rulesArray = (data["rules"]?.value as? [[String: Any]]) ?? []
    let rules: [PriceRule] = rulesArray.map { dict in
        PriceRule(
            name: dict["name"] as? String ?? "",
            category: dict["category"] as? String,
            materialType: dict["materialType"] as? String,
            laborRate: dict["laborRate"] as? Double,
            materialMarkup: dict["materialMarkup"] as? Double,
            addon: dict["addon"] as? Double
        )
    }
    return PriceBook(
        id: Ident(id),
        workspaceId: workspaceId,
        name: name,
        effectiveFrom: effectiveFromSeconds != nil ? Date(timeIntervalSince1970: effectiveFromSeconds!) : nil,
        rules: rules,
        updatedAt: Date(timeIntervalSince1970: updatedAtSeconds)
    )
}

public func priceBookToFirestore(_ priceBook: PriceBook) -> FirestoreDict {
    let rulesPayload: [[String: Any]] = priceBook.rules.map { rule in
        [
            "name": rule.name,
            "category": rule.category as Any,
            "materialType": rule.materialType as Any,
            "laborRate": rule.laborRate as Any,
            "materialMarkup": rule.materialMarkup as Any,
            "addon": rule.addon as Any
        ]
    }
    var payload: FirestoreDict = [
        "workspaceId": AnyCodable(priceBook.workspaceId),
        "name": AnyCodable(priceBook.name),
        "rules": AnyCodable(rulesPayload),
        "updatedAt": AnyCodable(priceBook.updatedAt.timeIntervalSince1970)
    ]
    if let effectiveFrom = priceBook.effectiveFrom {
        payload["effectiveFrom"] = AnyCodable(effectiveFrom.timeIntervalSince1970)
    }
    return payload
}
