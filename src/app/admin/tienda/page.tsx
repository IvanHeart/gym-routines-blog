import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getAdminProducts } from '@/dal/shop.dal'
import { deleteProductAction } from '@/actions/shop.actions'
import { formatPrice } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Productos',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminTiendaPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const { products, total } = await getAdminProducts({ page })
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} productos</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tienda/categorias">Categorías</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/tienda/nuevo">
              <Plus className="mr-1 h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay productos todavía.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{
                          borderColor: product.category.color,
                          color: product.category.color,
                        }}
                      >
                        {product.category.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.published ? 'default' : 'secondary'}>
                      {product.published ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link href={`/admin/tienda/${product.id}/editar`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <form
                        action={async () => {
                          'use server'
                          await deleteProductAction(product.id)
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          type="submit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === page ? 'default' : 'outline'} size="sm">
              <Link href={`/admin/tienda?page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
